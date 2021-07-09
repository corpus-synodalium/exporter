import axios from 'axios';
import saveAs from 'file-saver';
import queryString from 'query-string';
import React, { Component } from 'react';
import { Button, Card, Dropdown, Form, Icon, Message } from 'semantic-ui-react';
import './App.css';
import { getSortedIds, getCitation, getShortRecords } from './export-utils';

//==============================================================================
// Main Card
//==============================================================================

const EXPORT_MODES = {
    /**
     * Export metadata fields in citation format for each
     */
    CITATION: 'CITATION',
    /**
     * Export a list of unique record IDs
     */
    ID: 'ID',
    /**
     * Export a list of unique record IDs along with their metadata
     */
    SHORT_RECORD: 'SHORT_RECORD',
};

const DROPDOWN_OPTIONS = [
    {
        key: EXPORT_MODES.CITATION,
        text: 'Citation',
        value: EXPORT_MODES.CITATION,
    },
    {
        key: EXPORT_MODES.ID,
        text: 'Record ID',
        value: EXPORT_MODES.ID,
    },
    {
        key: EXPORT_MODES.SHORT_RECORD,
        text: 'Short record',
        value: EXPORT_MODES.SHORT_RECORD,
    },
];
class MainCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            url: props.inputURL,
        };
    }

    handleInputChange = event => this.setState({ url: event.target.value });

    handleSubmit = event => {
        this.props.handleInputURL(this.state.url);
    };

    render() {
        return (
            <div className="main-card-container">
                <div className="main-card">
                    <Card fluid>
                        <Card.Content>
                            <Card.Header className="card-header">
                                Export References
                            </Card.Header>
                            <Card.Description>
                                Choose export mode in the dropdown and click
                                "Export".
                            </Card.Description>
                            <br />
                            <Form>
                                <Form.Field>
                                    <input
                                        type="text"
                                        placeholder="Paste the search URL from CoSyn database here"
                                        value={this.state.url}
                                        onChange={this.handleInputChange}
                                    />
                                </Form.Field>
                            </Form>
                            <div className="export-container">
                                <Dropdown
                                    placeholder="Export Mode"
                                    selection
                                    value={this.props.exportMode}
                                    options={DROPDOWN_OPTIONS}
                                    onChange={this.props.handleDropdownChange}
                                    className="export-dropdown"
                                ></Dropdown>
                                <Button
                                    onClick={this.handleSubmit}
                                    loading={this.props.loading}
                                    color="blue"
                                >
                                    <Icon name="download" /> Export
                                </Button>
                            </div>
                        </Card.Content>
                        <Card.Content extra>
                            <a
                                className="hdd-icons"
                                href="https://corpus-synodalium.com/philologic/corpus/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Icon name="hdd" />
                                Corpus
                            </a>
                            <a
                                className="hdd-icons"
                                href="https://corpus-synodalium.com/philologic/corpusnorm/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Icon name="hdd outline" />
                                Corpusnorm
                            </a>
                        </Card.Content>
                    </Card>
                    <Message>
                        <Message.Header>Export modes</Message.Header>
                        <Message.List>
                            <Message.Item>
                                Citation: Export abbreviated citations for
                                search results
                            </Message.Item>
                            <Message.Item>
                                Record ID: Export a list of unique Record IDs
                                from search results
                            </Message.Item>
                            <Message.Item>
                                Short Record: Export unique Record IDs with
                                associated metadata
                            </Message.Item>
                        </Message.List>
                    </Message>
                </div>
            </div>
        );
    }
}

//==============================================================================
// App
//==============================================================================

class App extends Component {
    constructor(props) {
        super(props);
        const query = queryString.parse(window.location.search);
        this.state = {
            loading: false,
            inputURL: query.url,
            exportMode: EXPORT_MODES.CITATION,
        };
    }

    handleDropdownChange = (event, data) => {
        this.setState({
            exportMode: data.value,
        });
    };

    // BEGIN: handle input URL -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    handleInputURL = url => {
        if (!url) {
            window.alert(
                'URL cannot be empty. Please paste the search URL from the database here.'
            );
            return;
        }
        // Get only 1 result (end=1) to save time. We want to know total count of results.
        const testURL = url.replace('end=0', 'end=1').concat('&format=json');
        let query = null;
        this.setState({ loading: true });
        axios
            .get(testURL)
            .then(response => response.data)
            .then(testData => {
                // Now we know total count; Fetch all results
                const totalCount = testData.results_length;
                return axios.get(
                    url
                        .replace('end=0', `end=${totalCount}`)
                        .concat('&format=json')
                );
            })
            .then(response => response.data)
            .then(data => {
                query = data.query;
                this.saveTextFile(data, query, url);
                this.setState({
                    loading: false,
                });
            })
            .catch(error => {
                console.error(error);
                this.setState({ loading: false });
                window.alert(
                    'Oops... there was an error. Please make sure the URL is correct.'
                );
            });
    };

    // Save text blob with file-saver!
    saveTextFile = (data, query, url) => {
        const dateString = new Date().toISOString().substring(0, 10);
        const fileName = `${dateString}-${query.report}-${query.q}.txt`;
        let uniqueIdCount = null;
        let processedData = null;

        if (this.state.exportMode === EXPORT_MODES.ID) {
            const ids = getSortedIds(data.results);
            uniqueIdCount = ids.length;
            processedData = ids.join('\r\n');
        } else if (this.state.exportMode === EXPORT_MODES.CITATION) {
            const citations = getCitation(data.results);
            uniqueIdCount = citations.length;
            processedData = citations.join('\r\n');
        } else if (this.state.exportMode === EXPORT_MODES.SHORT_RECORD) {
            const shortRecords = getShortRecords(data.results, url);
            uniqueIdCount = shortRecords.length;
            processedData = shortRecords.join('\r\n');
        }

        if (processedData) {
            const blobData =
                `${url}\r\n\r\n` +
                `Query String: ${query.q}\r\n` +
                `Report Type: ${query.report}\r\n` +
                `Total Hits: ${query.end}\r\n` +
                `Number of Unique Record IDs: ${uniqueIdCount}\r\n\r\n` +
                processedData;
            const blob = new Blob([blobData], {
                type: 'text/plain;charset=utf-8',
            });
            saveAs(blob, fileName);
        }
    };

    // END: handle input URL =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

    render() {
        return (
            <div className="App">
                <MainCard
                    inputURL={this.state.inputURL}
                    handleInputURL={this.handleInputURL}
                    loading={this.state.loading}
                    exportMode={this.state.exportMode}
                    handleDropdownChange={this.handleDropdownChange}
                />
            </div>
        );
    }
}

export default App;

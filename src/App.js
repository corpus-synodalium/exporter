import axios from 'axios';
import saveAs from 'file-saver';
import queryString from 'query-string';
import React, { Component } from 'react';
import { Button, Card, Dropdown, Form, Icon, Popup } from 'semantic-ui-react';
import './App.css';

//==============================================================================
// Main Card
//==============================================================================

const EXPORT_MODES = {
    /**
     * Export a list of unique record IDs
     */
    ID: 'ID',
    /**
     * Export metadata fields in citation format for each
     */
    CITATION: 'CITATION',
};

const DROPDOWN_OPTIONS = [
    {
        key: EXPORT_MODES.ID,
        text: 'Record ID',
        value: EXPORT_MODES.ID,
    },
    {
        key: EXPORT_MODES.CITATION,
        text: 'Citation',
        value: EXPORT_MODES.CITATION,
        selected: true,
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
            <div className="main-card">
                <Card fluid>
                    <Card.Content>
                        <Card.Header>
                            {this.props.exportMode === EXPORT_MODES.ID
                                ? 'Export Record IDs'
                                : 'Export Citations'}
                        </Card.Header>
                        <Card.Description>
                            Click export to download a text report.{' '}
                            <Popup
                                trigger={<Icon name="question circle" />}
                                on="click"
                                content="The URL should be auto-filled for you below. If not, paste in the search URL from the PhiloLogic database."
                            />
                        </Card.Description>
                        <br />
                        <Form>
                            <Form.Field>
                                <input
                                    type="text"
                                    placeholder="URL from PhiloLogic"
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
        const testURL = url.replace('end=0', 'end=1').concat('&format=json');
        let query = null;
        this.setState({ loading: true });
        axios
            .get(testURL)
            .then(response => response.data)
            .then(testData => {
                query = testData.query;
                query.end = testData.results_length;
                return this.fetchData(query);
            })
            .then(data => {
                this.saveTextFile(data, query, url);
                this.setState({
                    loading: false,
                });
            })
            .catch(error => {
                console.error(error);
                this.setState({ loading: false });
                window.alert('Invalid URL');
            });
    };

    fetchData = query => {
        const baseURL = 'https://corpus-synodalium.com/philologic/corpus/query';
        return axios
            .get(baseURL, { params: query })
            .then(response => response.data)
            .catch(error => {
                console.error(error);
            });
    };

    getSortedIds = results => {
        const uniqueIDs = new Set();
        results.forEach(result => {
            const { record_id } = result.metadata_fields;
            uniqueIDs.add(record_id);
        });
        const ids = Array.from(uniqueIDs);
        ids.sort();
        return ids;
    };

    getCitation = results => {
        const uniqueCitations = new Map();
        results.forEach(result => {
            const {
                record_id,
                origPlace,
                year,
                edition,
                source,
            } = result.metadata_fields;

            if (!uniqueCitations.has(record_id)) {
                /**
                 * Format: Place (Year), in [Edition; if Edition field is empty, then instead display Source]
                 */
                const citationString = `${origPlace} (${year}), in ${
                    edition ? edition : source
                }`;
                uniqueCitations.set(record_id, citationString);
            }
        });

        return [...uniqueCitations.values()];
    };

    // Save text blob with file-saver!
    saveTextFile = (data, query, url) => {
        const dateString = new Date().toISOString().substring(0, 10);
        const fileName = `${dateString}-${query.report}-${query.q}.txt`;
        let uniqueIdCount = null;
        let processedData = null;

        if (this.state.exportMode === EXPORT_MODES.ID) {
            const ids = this.getSortedIds(data.results);
            uniqueIdCount = ids.length;
            processedData = ids.join('\r\n');
        } else if (this.state.exportMode === EXPORT_MODES.CITATION) {
            const citations = this.getCitation(data.results);
            uniqueIdCount = citations.length;
            processedData = citations.join('\r\n');
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

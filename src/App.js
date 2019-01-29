import React, { Component } from "react";
import "./App.css";
import axios from "axios";
import saveAs from "file-saver";
import { Button, Card, Icon, Form, Popup } from "semantic-ui-react";

//==============================================================================
// Main Card
//==============================================================================

class MainCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      url: ""
    };
  }

  handleChange = event => this.setState({ url: event.target.value });

  handleSubmit = event => {
    this.props.handleInputURL(this.state.url);
  };

  render() {
    return (
      <div className="main-card">
        <Card fluid>
          <Card.Content>
            <Card.Header>Export Record IDs</Card.Header>
            <Card.Description>
              Paste the search URL below.{" "}
              <Popup
                trigger={<Icon name="question circle" />}
                content="e.g.: https://corpus-synodalium.com/philologic/corpus/query?report=concordance&method=proxy&start=0&end=0&q=heading"
                on="click"
              />
            </Card.Description>
            <br />
            <Form>
              <Form.Field>
                <input
                  type="text"
                  value={this.state.url}
                  onChange={this.handleChange}
                />
              </Form.Field>
              <Button onClick={this.handleSubmit} loading={this.props.loading}>
                <Icon name="download" /> Export
              </Button>
            </Form>
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
    this.state = {
      loading: false
    };
  }

  // BEGIN: handle input URL -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  handleInputURL = url => {
    const testURL = url.replace("end=0", "end=1").concat("&format=json");
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
        const ids = this.processData(data);
        this.saveTextFile(ids, query, url);
        this.setState({
          loading: false
        });
      })
      .catch(error => {
        console.error(error);
        this.setState({ loading: false });
        window.alert("Invalid URL");
      });
  };

  fetchData = query => {
    const baseURL = "https://corpus-synodalium.com/philologic/corpus/query";
    return axios
      .get(baseURL, { params: query })
      .then(response => response.data)
      .catch(error => {
        console.error(error);
      });
  };

  processData = ({ results }) => {
    const uniqueIDs = new Set();
    results.forEach(result => {
      const { record_id } = result.metadata_fields;
      uniqueIDs.add(record_id);
    });
    const ids = Array.from(uniqueIDs);
    ids.sort();
    return ids;
  };

  // Save text blob with file-saver!
  saveTextFile = (ids, query, url) => {
    const dateString = new Date().toISOString().substring(0, 10);
    const fileName = `${dateString}-${query.report}-${query.q}.txt`;
    const blobData =
      `${url}\r\n\r\n` +
      `Query String: ${query.q}\r\n` +
      `Report Type: ${query.report}\r\n` +
      `Total Hits: ${query.end}\r\n` +
      `Number of Unique Record IDs: ${ids.length}\r\n\r\n` +
      ids.join("\r\n");
    const blob = new Blob([blobData], {
      type: "text/plain;charset=utf-8"
    });
    saveAs(blob, fileName);
  };

  // END: handle input URL =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

  render() {
    return (
      <div className="App">
        <MainCard
          handleInputURL={this.handleInputURL}
          loading={this.state.loading}
        />
      </div>
    );
  }
}

export default App;

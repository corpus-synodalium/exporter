import React, { Component } from "react";
import "./App.css";
import axios from "axios";
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
    console.log(this.state.url);
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
                <Icon name="checkmark" /> Export
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
      loading: false,
      recordIDs: undefined
    };
  }

  handleInputURL = url => {
    const testURL = url.replace("end=0", "end=1").concat("&format=json");
    let query = null;
    this.setState({ loading: true });
    axios
      .get(testURL)
      .then(response => response.data)
      .then(data => {
        query = data.query;
        query.end = data.results_length;
        this.fetchData(query);
      })
      .catch(error => {
        console.error(error);
        this.setState({ loading: false });
        window.alert("Invalid URL");
      });
  };

  fetchData = query => {
    const baseURL = "https://corpus-synodalium.com/philologic/corpus/query";
    axios
      .get(baseURL, { params: query })
      .then(response => response.data)
      .then(data => {
        // console.log(data);
        this.processData(data);
      })
      .catch(error => {
        console.error(error);
      });
  };

  processData = ({ results }) => {
    const totalHits = results.length;
    console.log(`Total hits: ${totalHits}`);
    const uniqueIDs = new Set();
    results.forEach(result => {
      const { record_id } = result.metadata_fields;
      uniqueIDs.add(record_id);
    });
    const ids = Array.from(uniqueIDs);
    ids.sort();
    console.log(ids);
    this.setState({
      loading: false,
      recordIDs: ids
    });
  };

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

import React from 'react';
import Chart from './chart';
import Depth from './depth';
import { prepareChartData, prepareDepthData } from './utils'; // getData, getDepthData,

class ChartComponent extends React.Component {
    componentDidMount() {
    // Here is the code for a testing on an external data
    /*
    getData().then(data => {
      this.setState({ data })
    })
    */
        if (this.props.data) {
            const preparedData = prepareChartData(this.props.data);
            this.setState({ data: preparedData });
        }
    }

    /*
  componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.data !== undefined && (this.state == null || nextProps.data !== this.state.data)) {
      const preparedData = prepareChartData(nextProps.data);
      this.setState({ data: preparedData });
    }
  }
  */
    componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
        if (this.props.data && this.props.data !== prevProps.data) {
            const preparedData = prepareChartData(this.props.data);
            this.setState({ data: preparedData });
        }
    }

    render() {
        if (this.state == null) {
            return <div className="loading-charts">Loading...</div>;
        } if (this.state.data.length < 2) {
            return <div className="loading-charts">Not enough data</div>;
        }
        return (
          <Chart type="hybrid" data={this.state.data} />
        );
    }
}

class DepthComponent extends React.Component {
    componentDidMount() {
    // Here is the code for a testing on an external data
    /*
    this.setState({data: getDepthData()});
    */
        if (this.props.data && this.props.data) {
            const preparedData = prepareDepthData(this.props.data);
            this.setState({ data: preparedData });
        }
    }

    /*
  componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.data !== undefined && (this.state == null || nextProps.data !== this.state.data)) {
    console.log(nextProps.data);
      const preparedData = prepareDepthData(nextProps.data);
      this.setState({ data: preparedData });
    }
  }
  */
  
    componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
        if (this.props.data && this.props.data !== prevProps.data) {
            const preparedData = prepareDepthData(this.props.data);
            this.setState({ data: preparedData });
        }
    }

    render() {
        if (this.state == null) {
            return <div className="loading-charts">Loading...</div>;
        } if (this.state.data.length < 2) {
            return <div className="loading-charts">Not enough data</div>;
        }
        return (
          <Depth type="hybrid" data={this.state.data} />
        );
    }
}

export { ChartComponent, DepthComponent };

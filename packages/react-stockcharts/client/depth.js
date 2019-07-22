import React from 'react';
import PropTypes from 'prop-types';

import { format } from 'd3-format';
import { timeFormat } from 'd3-time-format';
import { scaleLinear } from 'd3-scale';

import { ChartCanvas, Chart } from 'react-stockcharts';
import {
    AreaSeries,
} from 'react-stockcharts/lib/series';
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
import {
    CrossHairCursor,
    MouseCoordinateX,
    MouseCoordinateY,
} from 'react-stockcharts/lib/coordinates';

import { SingleValueTooltip } from 'react-stockcharts/lib/tooltip';
import { fitWidth } from 'react-stockcharts/lib/helper';
import {
    first, last, createVerticalLinearGradient, hexToRGBA,
} from 'react-stockcharts/lib/utils';


const AskAppearance = {
    stroke: '#2ecc40',
    strokeWidth: 1,
    strokeOpacity: 0,
    strokeDasharray: 'Solid',
    opacity: 1,
    fill: '#2ecc40',
    className: 'react-stockcharts-area-ask',
    canvasGradient: createVerticalLinearGradient([
        { stop: 0, color: hexToRGBA('#2ecc40', 0.2) },
        { stop: 0.7, color: hexToRGBA('#2ecc40', 0.4) },
        { stop: 1, color: hexToRGBA('#2ecc40', 0.8) },
    ]),
};

const BidAppearance = {
    stroke: '#db2828',
    strokeWidth: 1,
    strokeOpacity: 0,
    strokeDasharray: 'Solid',
    opacity: 1,
    fill: '#db2828',
    className: 'react-stockcharts-area-bid',
    canvasGradient: createVerticalLinearGradient([
        { stop: 0, color: hexToRGBA('#db2828', 0.2) },
        { stop: 0.7, color: hexToRGBA('#db2828', 0.4) },
        { stop: 1, color: hexToRGBA('#db2828', 0.8) },
    ]),
};
	
class DepthChart extends React.Component {
    render() {
        const {
            type, data, width, ratio,
        } = this.props;
        return (
            <ChartCanvas
            height={400}
            width={width}
                ratio={ratio}
            margin={{
                    left: 70, right: 70, top: 20, bottom: 30,
                }}
            type={type}
            seriesName="Depth"
            data={data}
                panEvent={false}
                zoomEvent={false}
            xScale={scaleLinear()}
                xExtents={[first(data).value, last(data).value]}
            xAccessor={d => d.value}
          >
                <Chart
                id={1}
                height={350}
                yExtents={[d => d.totalvolume]}
                padding={{ top: 10, bottom: 20 }}
                yScale={scaleLinear()}
              >
                <XAxis axisAt="bottom" orient="bottom" ticks={5} />
                    <YAxis axisAt="right" orient="right" ticks={5} />
                    <YAxis axisAt="left" orient="left" ticks={5} />

                    <SingleValueTooltip
                    yLabel="Amount"
                    yDisplayFormat={format('.2f')}
                    yAccessor={d => d.totalvolume}
                        xLabel="Price"
                        xDisplayFormat={format('.2f')}
                    xAccessor={d => d.value}
                    origin={[0, 0]}
                  />

                    <AreaSeries
                        yAccessor={d => (d.type == 'ask' ? d.totalvolume : null)}
                        {...AskAppearance}
                  />

                <AreaSeries
                        yAccessor={d => (d.type == 'bid' ? d.totalvolume : null)}
                        {...BidAppearance}
                    />

              </Chart>
                <CrossHairCursor />
          </ChartCanvas>
        );
    }
}

DepthChart.propTypes = {
    data: PropTypes.array.isRequired,
    width: PropTypes.number.isRequired,
    ratio: PropTypes.number.isRequired,
    type: PropTypes.oneOf(['svg', 'hybrid']).isRequired,
};

DepthChart.defaultProps = {
    type: 'svg',
};

DepthChart = fitWidth(DepthChart);

export default DepthChart;

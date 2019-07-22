import { tsvParse } from 'd3-dsv';
import { timeParse } from 'd3-time-format';

function parseData(parse) {
    return function(d) {
        d.date = parse(d.date);
        d.open = +d.open;
        d.high = +d.high;
        d.low = +d.low;
        d.close = +d.close;
        d.volume = +d.volume;

        return d;
    };
}

const parseDate = timeParse('%Y-%m-%d');

export function getData() {
    const promiseMSFT = fetch('https://cdn.rawgit.com/rrag/react-stockcharts/master/docs/data/MSFT.tsv')
        .then(response => response.text())
        .then(data => tsvParse(data, parseData(parseDate)));
    return promiseMSFT;
}

export function prepareChartData(data) {
    return _.map(data, function(d) {
        const out = {};
        out.date = new Date(d.Date);
        out.open = +d.Open;
        out.high = +d.High;
        out.low = +d.Low;
        out.close = +d.Close;
        out.volume = +d.Volume;
        return out;
    });
}

export function getDepthData() {
    const promiseDepth = _.map(_.range(0, 200), function(index) {
        if (index < 100) {
            return { count: (200 - index) * 1000, ask: (100 + index) * 10, bid: undefined };
        }
        return { count: index * 1000, ask: undefined, bid: 1000 + index * 10 };
    });
    return promiseDepth;
}

export function prepareDepthData(data) {
    let _localtData = Object.assign({}, data);
    if (!_localtData.Asks || !_localtData.Bids) {
        return [];
    }
    const out = [];
    // Function to process (sort and calculate cummulative volume)
    function processData(list, type) {
        let _tmp = list;
    
        // Convert to data points
        for (var i = 0; i < list.length; i++) {
            _tmp[i] = {
                value: Number(list[i][0]),
                volume: Number(list[i][1]),
                type,
            };
        }

        // Sort list just in case
        _tmp.sort(function(a, b) {
            if (a.value > b.value) {
                return 1;
            }
            if (a.value < b.value) {
                return -1;
            }
            
            return 0;
        });

        // Calculate cummulative volume
        if (type == 'ask') {
            for (var i = _tmp.length - 1; i >= 0; i--) {
                if (i < (_tmp.length - 1)) {
                    _tmp[i].totalvolume = _tmp[i + 1].totalvolume + _tmp[i].volume;
                } else {
        	// the first ask
                    _tmp[i].totalvolume = _tmp[i].volume;
                }
                var dp = {};
                dp.value = _tmp[i].value;
                dp.volume = _tmp[i].volume;
                dp.totalvolume = _tmp[i].totalvolume;
                dp.type = _tmp[i].type;
                out.unshift(dp);
            }
        } else {
            for (var i = 0; i < _tmp.length; i++) {
                if (i > 0) {
                    _tmp[i].totalvolume = _tmp[i - 1].totalvolume + _tmp[i].volume;
                } else {
                    _tmp[i].totalvolume = _tmp[i].volume;
                }
                var dp = {};
                dp.value = _tmp[i].value;
                dp.volume = _tmp[i].volume;
                dp.totalvolume = _tmp[i].totalvolume;
                dp.type = _tmp[i].type;
                out.push(dp);
            }
        }
        _tmp = null;
    }
  
    processData(_localtData.Asks, 'ask');
    processData(_localtData.Bids, 'bid');

    _localtData = null;
  
    // Sort list just in case
    out.sort(function(a, b) {
        if (a.value > b.value) {
            return 1;
        }
        if (a.value < b.value) {
            return -1;
        }
        
        return 0;
    });

    return out;
}

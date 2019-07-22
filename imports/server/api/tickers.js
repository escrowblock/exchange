import { _ } from 'meteor/underscore';
import { check } from 'meteor/check';
import Api from './config.js';
import { getDepthData } from '/imports/tools';
import {
    ticker, price_average, price_24hr, price_latest,
} from '/imports/collections';

/**
 * Get ticker history
 */
Api.addRoute('gettickerhistory',
    {
        authRequired: false,
        enableCors: true,
    },
    {
        get: {
            action() {
                // string - The Symbol of a specific instrument.
                check(this.bodyParams.InstrumentSymbol, String);

                // integer - Oldest date from which the ticker history will start, in milliseconds
                this.bodyParams.FromDate = Number(this.bodyParams.FromDate).valueOf();
                check(this.bodyParams.FromDate, Number);

                // integer - Date to which the ticker history will end, in milliseconds
                this.bodyParams.ToDate = Number(this.bodyParams.ToDate).valueOf();
                check(this.bodyParams.ToDate, Number);

                // string - Interval of data aggregation. `m` is minutes; `h` is hours; `d` is days; `w` is weeks; `M` is months
                // 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
                check(this.bodyParams.Interval, String);

                if (_.indexOf(['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'],
                    this.bodyParams.Interval, true) == -1) {
                    return {
                        status: 'error',
                        timestamp: new Date().getTime(),
                        message: 'Wrong interval',
                    };
                }

                return {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: ticker.find({
                        InstrumentSymbol: this.bodyParams.InstrumentSymbol,
                        $gte: { Date: this.bodyParams.FromDate },
                        $lte: { Date: this.bodyParams.ToDate },
                        Interval: this.bodyParams.Interval,
                    },
                    {
                        fields: {
                            Date: 1,
                            High: 1,
                            Low: 1,
                            Open: 1,
                            Close: 1,
                            Volume: 1,
                            InsideBidPrice: 1,
                            InsideAskPrice: 1,
                            InstrumentSymbol: 1,
                        },
                        sort: {
                            Date: -1,
                        },
                    }).fetch(),
                };
            },
        },
    });

/**
 * Get average price
 */
Api.addRoute('getaverageprice',
    {
        authRequired: false,
        enableCors: true,
    },
    {
        get: {
            action() {
                // string - The Symbol of a specific instrument.
                this.bodyParams.InstrumentSymbol = String(this.bodyParams.InstrumentSymbol).valueOf();
                check(this.bodyParams.InstrumentSymbol, String);

                const symbols = this.bodyParams.InstrumentSymbol.split(',');
                return {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: price_average.find({ InstrumentSymbol: { $in: symbols } },
                        {
                            fields: {
                                Minutes: 1,
                                Price: 1,
                            },
                        }).fetch(),
                };
            },
        },
    });

/**
 * Get 24hr ticker price change statistics
 */
Api.addRoute('get24hrprice',
    {
        authRequired: false,
        enableCors: true,
    },
    {
        get: {
            action() {
                // string - The Symbol of a specific instrument.
                this.bodyParams.InstrumentSymbol = String(this.bodyParams.InstrumentSymbol).valueOf();
                check(this.bodyParams.InstrumentSymbol, String);

                const symbols = this.bodyParams.InstrumentSymbol.split(',');
                return {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: price_24hr.find({ InstrumentSymbol: { $in: symbols } },
                        {
                            fields: {
                                InstrumentSymbol: 1,
                                PriceChange: 1,
                                PriceChangePercent: 1,
                                AveragePrice: 1,
                                PrevClosePrice: 1,
                                LastPrice: 1,
                                LastQty: 1,
                                BidPrice: 1,
                                AskPrice: 1,
                                OpenPrice: 1,
                                HighPrice: 1,
                                LowPrice: 1,
                                Volume: 1,
                                QuoteVolume: 1,
                                OpenTime: 1,
                                CloseTime: 1,
                                TradeCount: 1,
                            },
                        }).fetch(),
                };
            },
        },
    });

/**
 * Get latest price
 */
Api.addRoute('getlatestprice',
    {
        authRequired: false,
        enableCors: true,
    },
    {
        get: {
            action() {
                // string - The Symbol of a specific instrument.
                this.bodyParams.InstrumentSymbol = String(this.bodyParams.InstrumentSymbol).valueOf();
                check(this.bodyParams.InstrumentSymbol, String);

                const symbols = this.bodyParams.InstrumentSymbol.split(',');
                return {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: price_latest.find({ InstrumentSymbol: { $in: symbols } },
                        {
                            fields: {
                                InstrumentSymbol: 1,
                                Price: 1,
                            },
                        }).fetch(),
                };
            },
        },
    });

/**
 * Get depth
 */
Api.addRoute('getdepth',
    {
        authRequired: false,
        enableCors: true,
    },
    {
        get: {
            action() {
                // string - The Symbol of a specific instrument.
                this.bodyParams.InstrumentSymbol = String(this.bodyParams.InstrumentSymbol).valueOf();
                check(this.bodyParams.InstrumentSymbol, String);

                // integer - Limit for depth
                if (!_.isUndefined(this.bodyParams.Limit)) {
                    this.bodyParams.Limit = Number(this.bodyParams.Limit).valueOf();
                    check(this.bodyParams.Limit, Number);
                } else {
                    this.bodyParams.Limit = 100;
                }

                if (_.indexOf([5, 10, 20, 50, 100, 500, 1000], this.bodyParams.Limit, true) == -1) {
                    return {
                        status: 'error',
                        timestamp: new Date().getTime(),
                        message: 'Wrong limit',
                    };
                }

                return {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: getDepthData(this.bodyParams.InstrumentSymbol, this.bodyParams.Limit),
                };
            },
        },
    });

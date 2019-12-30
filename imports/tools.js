import { Random } from 'meteor/random';
import { Decimal } from 'meteor/mongo-decimal';
import { Job } from 'meteor/vsivsi:job-collection';
import {
    profile, MatchingEngineJobs, order, price_24hr, price_latest, ticker, price_average, instrument, product, balance, transaction, fee, trade, variable,
} from '/imports/collections';
import asyncX from 'async';
import { moment } from 'meteor/momentjs:moment';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import createNewTalk from '/imports/cryptoTalk';

const getCategoryListInstrumentSymbol = function() {
    return [{ Short: 'favorite', FullName: 'Favorite' },
        { Short: 'btc', FullName: 'BTC' },
        { Short: 'eth', FullName: 'ETH' },
        { Short: 'escb', FullName: 'ESCB' },
        { Short: 'crypto', FullName: 'Crypto coins' },
        { Short: 'asia', FullName: 'Asia currencies' },
        { Short: 'europe', FullName: 'Europe currencies' },
        { Short: 'world', FullName: 'National currencies' },
        { Short: 'other', FullName: 'Other' },
    ];
};
    
const getCategoryByInstrumentSymbol = function(doc, userId, InstrumentSymbol) {
    let Category = 'other';
    let favorite = [];
    if (userId && profile.findOne({ UserId: userId }) && profile.findOne({ UserId: userId }).Favorite) {
        favorite = profile.findOne({ UserId: userId }).Favorite;
    }
    
    if (favorite && favorite.indexOf(InstrumentSymbol) !== -1) {
        Category = 'favorite';
    } else {
        switch (doc.Product2Symbol) {
        case 'BTC':
            Category = 'btc';
            break;
        case 'ETH':
            Category = 'eth';
            break;
        case 'ESCB':
            Category = 'escb';
            break;
        case 'PAX':
        case 'TUSD':
        case 'USDC':
        case 'USDS':
        case 'BNB':
        case 'XRP':
            Category = 'crypto';
            break;
        case 'MYR':
        case 'PHP':
        case 'SGD':
        case 'THB':
        case 'JPY':
        case 'CNY':
        case 'HKD':
        case 'IDR':
        case 'INR':
        case 'KRW':
            Category = 'asia';
            break;
        case 'EUR':
        case 'BGN':
        case 'CZK':
        case 'DKK':
        case 'GBP':
        case 'HUF':
        case 'PLN':
        case 'RON':
        case 'SEK':
        case 'CHF':
        case 'ISK':
        case 'NOK':
        case 'HRK':
        case 'RUB':
        case 'TRY':
            Category = 'europe';
            break;
        case 'USD':
        case 'AUD':
        case 'BRL':
        case 'CAD':
        case 'ILS':
        case 'MXN':
        case 'NZD':
        case 'ZAR':
        default:
            Category = 'world';
            break;
        }
    }
    return Category;
};

const getDepthData = function(InstrumentSymbol, limit) {
    check(InstrumentSymbol, String);

    const Asks = order.find({
        InstrumentSymbol, Side: 'Buy', OrderType: 'Limit', OrderState: 'Working',
    }, { fields: { Price: 1, Quantity: 1 }, limit }).map(function(obj) {
        return [obj.Price, obj.Quantity];
    });
    
    Asks.sort(function (a, b) {
        if (a[0].gt(b[0])) {
            return 1;
        }
        if (a[0].lt(b[0])) {
            return -1;
        }
        return 0;
    });
    
    const Bids = order.find({
        InstrumentSymbol, Side: 'Sell', OrderType: 'Limit', OrderState: 'Working',
    }, { fields: { Price: 1, Quantity: 1 }, limit }).map(function(obj) {
        return [obj.Price, obj.Quantity];
    });
    
    Bids.sort(function (a, b) {
        if (a[0].lt(b[0])) {
            return 1;
        }
        if (a[0].gt(b[0])) {
            return -1;
        }
        return 0;
    });
    
    return {
        InstrumentSymbol, Asks, Bids, Limit: limit,
    };
};

/**
 * Update price for 24 hrs by InstrumentSymbol for this trade record
* */
const updatePrice24 = function(currentDate, doc) {
    if (!doc.Initial) {
        return false;
    }
    const openTime = moment.utc(currentDate).startOf('day');
    const closeTime = moment.utc(currentDate).endOf('day');
  
    const previousPrice24 = price_24hr.findOne({ InstrumentSymbol: doc.InstrumentSymbol, openTime: openTime.valueOf() });

    if (!previousPrice24) {
        price_24hr.insert({
            InstrumentSymbol: doc.InstrumentSymbol,
            PriceChange: doc.Price,
            PriceChangePercent: Decimal('0'),
            AveragePrice: doc.Price,
            PrevClosePrice: Decimal('0'),
            LastPrice: doc.Price,
            LastQty: doc.Quantity,
            BidPrice: Decimal('0'), // @TODO take from order ?
            AskPrice: Decimal('0'), // @TODO take from order ?
            OpenPrice: doc.Price,
            HighPrice: doc.Price,
            LowPrice: doc.Price,
            Volume: doc.Quantity,
            QuoteVolume: doc.Price.times(doc.Quantity),
            OpenTime: openTime.valueOf(),
            CloseTime: closeTime.valueOf(),
            TradeCount: 1,
        });
    } else {
        price_24hr.update(
            { InstrumentSymbol: doc.InstrumentSymbol },
            {
                $set: {
                    PriceChange: doc.Price.sub(previousPrice24.LastPrice),
                    PriceChangePercent: Decimal(doc.Price.sub(previousPrice24.LastPrice).div(previousPrice24.LastPrice).toFixed(6)),
                    AveragePrice: Decimal(previousPrice24.LastPrice.add(doc.Price).div(2).toFixed(6)),
                    LastPrice: doc.Price,
                    LastQty: doc.Quantity,
                    BidPrice: Decimal('0'), // @TODO take from order ?
                    AskPrice: Decimal('0'), // @TODO take from order ?
                    HighPrice: previousPrice24.HighPrice.lt(doc.Price) ? doc.Price : previousPrice24.HighPrice,
                    LowPrice: previousPrice24.LowPrice.gt(doc.Price) ? doc.Price : previousPrice24.LowPrice,
                    Volume: previousPrice24.Volume.add(doc.Quantity),
                    QuoteVolume: previousPrice24.QuoteVolume.add(doc.Price.times(doc.Quantity)),
                    TradeCount: (previousPrice24.TradeCount + 1),
                },
            },
        );
    }
    return null;
};

/**
 * Update latest price by InstrumentSymbol for this trade record
* */
const updateLatestPrice = function(currentDate, doc) {
    if (!doc.Initial) {
        return false;
    }
    
    price_latest.upsert(
        { InstrumentSymbol: doc.InstrumentSymbol },
        {
            $set: {
                Price: doc.Price,
                UpdatedTime: currentDate.getTime(),
            },
        },
    );
    return null;
};

/**
 * Update all intervals by InstrumentSymbol for this trade record
* */
const updateTicker = function(currentDate, doc) {
    if (!doc.Initial) {
        return null;
    }
    let _tmp;
    _.map(['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'], (interval) => {
        let intervalBeginDate;
        const currentUtc = moment.utc(currentDate);
        switch (interval) {
        case '1m':
            intervalBeginDate = currentUtc.subtract(1, 'm').startOf('minute');
            break;
        case '3m':
            _tmp = currentUtc.minutes();
            intervalBeginDate = currentUtc.startOf('hour').add(Decimal(_tmp / 3).floor() * 3, 'm').startOf('minute');
            break;
        case '5m':
            _tmp = currentUtc.minutes();
            intervalBeginDate = currentUtc.startOf('hour').add(Decimal(_tmp / 5).floor() * 5, 'm').startOf('minute');
            break;
        case '15m':
            _tmp = currentUtc.minutes();
            intervalBeginDate = currentUtc.startOf('hour').add(Decimal(_tmp / 15).floor() * 15, 'm').startOf('minute');
            break;
        case '30m':
            _tmp = currentUtc.minutes();
            intervalBeginDate = currentUtc.startOf('hour').add(Decimal(_tmp / 30).floor() * 30, 'm').startOf('minute');
            break;
        case '1h':
            intervalBeginDate = currentUtc.subtract(1, 'h').startOf('hour');
            break;
        case '2h':
            _tmp = currentUtc.hours();
            intervalBeginDate = currentUtc.startOf('day').add(Decimal(_tmp / 2).floor() * 2, 'h').startOf('hour');
            break;
        case '4h':
            _tmp = currentUtc.hours();
            intervalBeginDate = currentUtc.startOf('day').add(Decimal(_tmp / 4).floor() * 4, 'h').startOf('hour');
            break;
        case '6h':
            _tmp = currentUtc.hours();
            intervalBeginDate = currentUtc.startOf('day').add(Decimal(_tmp / 6).floor() * 6, 'h').startOf('hour');
            break;
        case '8h':
            _tmp = currentUtc.hours();
            intervalBeginDate = currentUtc.startOf('day').add(Decimal(_tmp / 8).floor() * 8, 'h').startOf('hour');
            break;
        case '12h':
            _tmp = currentUtc.hours();
            intervalBeginDate = currentUtc.startOf('day').add(Decimal(_tmp / 12).floor() * 12, 'h').startOf('hour');
            break;
        case '1d':
            intervalBeginDate = currentUtc.subtract(1, 'd').startOf('day');
            break;
        case '3d':
            _tmp = currentUtc.days();
            intervalBeginDate = currentUtc.startOf('month').add(Decimal(_tmp / 3).floor() * 3, 'd').startOf('day');
            break;
        case '1w':
            intervalBeginDate = currentUtc.subtract(1, 'w').startOf('week');
            break;
        case '1M':
            intervalBeginDate = currentUtc.subtract(1, 'M').startOf('month');
            break;
        default:
            return null;
            // break;
        }
        intervalBeginDate = intervalBeginDate.valueOf();


        const currentState = ticker.findOne({
            InstrumentSymbol: doc.InstrumentSymbol,
            Interval: interval,
            Date: intervalBeginDate,
        });
        if (_.isUndefined(currentState)) {
            ticker.insert(
                {
                    InstrumentSymbol: doc.InstrumentSymbol,
                    Interval: interval,
                    Date: intervalBeginDate,
                    High: doc.Price,
                    Low: doc.Price,
                    Open: doc.Price,
                    Close: doc.Price,
                    Volume: doc.Quantity,
                    InsideBidPrice: Decimal('0'), // @TODO need take in order ?
                    InsideAskPrice: Decimal('0'), // @TODO need take in order ?
                },
            );
        } else {
            ticker.update(
                { InstrumentSymbol: doc.InstrumentSymbol, Interval: interval, Date: intervalBeginDate },
                {
                    $set: {
                        High: currentState.High.lt(doc.Price) ? doc.Price : currentState.High,
                        Low: currentState.Low.gt(doc.Price) ? doc.Price : currentState.Low,
                        Close: doc.Price,
                        Volume: currentState.Volume.add(doc.Quantity),
                        InsideBidPrice: Decimal('0'), // @TODO need take in order ?
                        InsideAskPrice: Decimal('0'), // @TODO need take in order ?
                    },
                },
            );
        }
        return null;
    });
    return null;
};

/**
 * Update average price by InstrumentSymbol for this trade record
* */
const updateAveragePrice = function(currentDate, doc) {
    if (!doc.Initial) {
        return false;
    }
    
    const currentAveragePrice = price_average.findOne({ InstrumentSymbol: doc.InstrumentSymbol });
    if (_.isUndefined(currentAveragePrice)) {
        price_average.insert({
            InstrumentSymbol: doc.InstrumentSymbol,
            Price: doc.Price,
            UpdatedTime: currentDate.getTime(),
        });
    } else {
        price_average.update({ InstrumentSymbol: doc.InstrumentSymbol },
            {
                $set: {
                    Price: currentAveragePrice.Price.add(doc.Price).div(2),
                    UpdatedTime: currentDate.getTime(),
                },
            });
    }
    return null;
};

const calculateAlgoOrders = function(currentDate, docTrade, cb = () => {}) {
    if (!docTrade.Initial) {
        cb();
        return false;
    }
    
    order.update({
        InstrumentSymbol: docTrade.InstrumentSymbol,
        OrderType: { $in: ['StopMarket', 'StopLimit', 'TrailingStopMarket', 'TrailingStopLimit'] },
        Side: 'Buy',
        OrderState: 'Working',
        StopPrice: { $lte: docTrade.Price },
    },
    { $set: { OrderState: 'InProcess' } },
    { multi: true });
                                      
    // Try to run StopPrice orders
    const buyStopOrders = order.find({
        InstrumentSymbol: docTrade.InstrumentSymbol,
        OrderType: { $in: ['StopMarket', 'StopLimit', 'TrailingStopMarket', 'TrailingStopLimit'] },
        Side: 'Buy',
        OrderState: 'InProcess',
        StopPrice: { $lte: docTrade.Price },
    }).fetch();

    const executedOrderId = [];

    // We must have a whole order for inserting
    asyncX.mapSeries(buyStopOrders, function(orderArg, cbBuyStop) {
        const _order = Object.assign({}, orderArg);
        order.update({ _id: _order._id }, { $set: { OrderState: 'Rejected', RejectReason: 'Algorithmic trade' } }, function() {
            if (_order.OrderType == 'TrailingStopLimit') {
                _order.LimitPrice = _order.StopPrice.add(_order.LimitOffset);
            }
            _order.OrderType = (_order.OrderType.indexOf('Market') != -1 ? 'Market' : 'Limit');
            _order.PreviousOrderRevision = _order._id;
            executedOrderId.push(_order._id);
            const _orderId = _order._id;
            delete _order._id;
            _order.OrderState = 'Working';
            _order.ReceiveTime = Date.now();
            
            try {
                order.insert(_order, function(e) {
                    if (e) {
                        throw new Meteor.Error(e);
                    }
                    cbBuyStop();
                });
            } catch (e) {
                // reverse balance for Algo
                order.update({ _id: _orderId }, { $set: { OrderState: 'Expired', RejectReason: '' } }, function() {
                    cbBuyStop();
                });
            }
        });
    });

    order.update({
        InstrumentSymbol: docTrade.InstrumentSymbol,
        OrderType: { $in: ['StopMarket', 'StopLimit', 'TrailingStopMarket', 'TrailingStopLimit'] },
        Side: 'Sell',
        OrderState: 'Working',
        StopPrice: { $gte: docTrade.Price },
    },
    { $set: { OrderState: 'InProcess' } },
    { multi: true });
                
    const sellStopOrders = order.find({
        InstrumentSymbol: docTrade.InstrumentSymbol,
        OrderType: { $in: ['StopMarket', 'StopLimit', 'TrailingStopMarket', 'TrailingStopLimit'] },
        Side: 'Sell',
        OrderState: 'InProcess',
        StopPrice: { $gte: docTrade.Price },
    }).fetch();

    // We must have a whole order for inserting
    asyncX.mapSeries(sellStopOrders, function(orderArg, cbSellStop) {
        const _order = Object.assign({}, orderArg);
        order.update({ _id: _order._id }, { $set: { OrderState: 'Rejected', RejectReason: 'Algorithmic trade' } }, function() {
            if (_order.OrderType == 'TrailingStopLimit') {
                _order.LimitPrice = _order.StopPrice.sub(_order.LimitOffset);
            }
            _order.OrderType = (_order.OrderType.indexOf('Market') != -1 ? 'Market' : 'Limit');
            _order.PreviousOrderRevision = _order._id;
            const _orderId = _order._id;
            executedOrderId.push(_order._id);
            delete _order._id;
            _order.OrderState = 'Working';
            _order.ReceiveTime = Date.now();
            
            try {
                const result = new Promise((resolve) => {
                    order.insert(_order, function(error) {
                        if (!error) {
                            resolve(true);
                        } else {
                            resolve(new Meteor.Error(error));
                        }
                    });
                }).await();
                if (result === true) {
                    cbSellStop();
                } else {
                    throw new Meteor.Error(result);
                }
            } catch (e) {
                // reverse balance for Algo
                order.update({ _id: _orderId }, { $set: { OrderState: 'Expired', RejectReason: '' } }, function() {
                    cbSellStop();
                });
            }
        });
    });
    
    const trailingOrders = order.find({
        InstrumentSymbol: docTrade.InstrumentSymbol,
        OrderType: { $in: ['TrailingStopMarket', 'TrailingStopLimit'] },
        Side: { $in: ['Buy', 'Sell'] },
        OrderState: 'Working',
    },
    {
        fields: {
            StopPrice: 1,
            TrailingAmount: 1,
            PegPriceType: 1,
            Side: 1,
        },
    }).fetch();

    asyncX.mapSeries(trailingOrders, function(orderArg, cbTrailing) {
        let updateFlag = false;
        const _order = Object.assign({}, orderArg);
        switch (_order.PegPriceType) {
        case 'Last':
            if (_order.Side == 'Buy') {
                if (_order.StopPrice.add(_order.TrailingAmount).gt(docTrade.Price)) {
                    _order.StopPrice = docTrade.Price.add(_order.TrailingAmount);
                    updateFlag = true;
                }
            } else if (_order.StopPrice.add(_order.TrailingAmount).lt(docTrade.Price)) {
                _order.StopPrice = docTrade.Price.sub(_order.TrailingAmount);
                updateFlag = true;
            }
            break;
        case 'Bid':
            if (_order.Side == 'Buy') {
                if (_order.StopPrice.add(_order.TrailingAmount).gt(docTrade.TradeBid)) {
                    _order.StopPrice = docTrade.TradeBid.add(_order.TrailingAmount);
                    updateFlag = true;
                }
            } else if (_order.StopPrice.add(_order.TrailingAmount).lt(docTrade.TradeBid)) {
                _order.StopPrice = docTrade.TradeBid.sub(_order.TrailingAmount);
                updateFlag = true;
            }
            break;
        case 'Ask':
            if (_order.Side == 'Buy') {
                if (_order.StopPrice.add(_order.TrailingAmount).gt(docTrade.TradeAsk)) {
                    _order.StopPrice = docTrade.TradeAsk.add(_order.TrailingAmount);
                    updateFlag = true;
                }
            } else if (_order.StopPrice.add(_order.TrailingAmount).lt(docTrade.TradeAsk)) {
                _order.StopPrice = docTrade.TradeAsk.sub(_order.TrailingAmount);
                updateFlag = true;
            }
            break;
        case 'Midpoint':
            if (_order.Side == 'Buy') {
                if (_order.StopPrice.add(_order.TrailingAmount).gt(docTrade.TradeMidpoint)) {
                    _order.StopPrice = docTrade.TradeMidpoint.add(_order.TrailingAmount);
                    updateFlag = true;
                }
            } else if (_order.StopPrice.add(_order.TrailingAmount).lt(docTrade.TradeMidpoint)) {
                _order.StopPrice = docTrade.TradeMidpoint.sub(_order.TrailingAmount);
                updateFlag = true;
            }
            break;
        default:
            break;
        }
        
        if (updateFlag) {
            order.update({ _id: _order._id }, { $set: { StopPrice: _order.StopPrice, ReceiveTime: Date.now() } }, function() {
                cbTrailing(null, _order._id);
            });
        } else {
            cbTrailing(null, _order._id);
        }
    }, function(error, executedResult) {
        if (!_.isEmpty(executedResult)) {
            order.update({ _id: { $in: executedResult }, OrderState: 'InProcess' },
                { $set: { OrderState: 'Working' } },
                { multi: true });
        }
    });

    cb();
    return null;
};

const _getFeeByOrder = function(doc, orderExecution) {
    const _fee = {
        maker: [Decimal('0'), 'X'],
        taker: [Decimal('0'), 'X'],
    };

    const commonFee = variable.findOne({ Name: 'CommonFee', Security: true }) ? variable.findOne({ Name: 'CommonFee', Security: true }).Value : '0.001';

    const _product = String(doc.InstrumentSymbol).split('_');

    const _p0 = (doc.Side == 'Buy' ? doc.QuantityExecuted : doc.Price.times(doc.QuantityExecuted));
    const _p1 = (doc.Side == 'Buy' ? doc.Price.times(doc.QuantityExecuted) : doc.QuantityExecuted);

    if (doc.Side == 'Buy' && orderExecution.Side == 'Sell') {
        const _productSymbol1 = product.findOne({ ProductSymbol: _product[1] }, { fields: { NoFees: 1, Deferred: 1 } });
        if (!_productSymbol1.NoFees) {
            const personalFeeTaker = fee.findOne({ UserId: doc.UserId }) ? fee.findOne({ UserId: doc.UserId }).FeeTaker : Decimal(commonFee);
            if (!_productSymbol1.Deferred) {
                _fee.taker = [_p1.times(personalFeeTaker), _product[1]];
            } else {
                _fee.taker = [_p0.times(personalFeeTaker), _product[0]];
            }
        }
        const _productSymbol0 = product.findOne({ ProductSymbol: _product[0] }, { fields: { NoFees: 1, Deferred: 1 } });
        if (!_productSymbol0.NoFees) {
            const personalFeeMaker = fee.findOne({ UserId: orderExecution.UserId }) ? fee.findOne({ UserId: orderExecution.UserId }).FeeMaker : Decimal(commonFee);
            if (!_productSymbol0.Deferred) {
                _fee.maker = [_p0.times(personalFeeMaker), _product[0]];
            } else {
                _fee.maker = [_p1.times(personalFeeMaker), _product[1]];
            }
        }
    } else {
        const _productSymbol1 = product.findOne({ ProductSymbol: _product[1] }, { fields: { NoFees: 1, Deferred: 1 } });
        if (!_productSymbol1.NoFees) {
            const personalFeeTaker = fee.findOne({ UserId: orderExecution.UserId }) ? fee.findOne({ UserId: orderExecution.UserId }).FeeTaker : Decimal(commonFee);
            if (!_productSymbol1.Deferred) {
                _fee.taker = [_p1.times(personalFeeTaker), _product[1]];
            } else {
                _fee.taker = [_p0.times(personalFeeTaker), _product[0]];
            }
        }
        const _productSymbol0 = product.findOne({ ProductSymbol: _product[0] }, { fields: { NoFees: 1, Deferred: 1 } });
        if (!_productSymbol0.NoFees) {
            const personalFeeMaker = fee.findOne({ UserId: doc.UserId }) ? fee.findOne({ UserId: doc.UserId }).FeeMaker : Decimal(commonFee);
            if (!_productSymbol0.Deferred) {
                _fee.maker = [_p0.times(personalFeeMaker), _product[0]];
            } else {
                _fee.maker = [_p1.times(personalFeeMaker), _product[1]];
            }
        }
    }
    
    if (_fee.maker[0].eq('0')) {
        _fee.maker[1] = 'X';
    }
    
    if (_fee.taker[0].eq('0')) {
        _fee.taker[1] = 'X';
    }
    
    return _fee;
};

/**
* Instrument is ETH_BTC
* For example:
*     0.031112 BTC = 1 ETH
*
* if buy 1.333 ETH, then on BTC account (_p1) need to remove 0.031112*1.333 = 0.041472296, or 10 - 0.041472296 = 9.958527704
*     and after a deal on ETH account (_p0) add 1.333 ETH, or 10 + 1.333 = 11.333
*
* if sell 1.333 ETH, then on ETH account (_p0) need to remove 1.333 ETH, or 11.333 - 1.333 = 10
*     and after a deal on BTC account (_p1) add 0.031112*1.333 = 0.041472296, or 9.958527704 + 0.041472296 = 10
* */
const _changeBalanceByTrade = function(userId, InstrumentSymbol, side, tradeId, value, quantity, fee) { // fee is array with 0 - value, 1 - product
    const currentTime = new Date().getTime();

    if (!_.isUndefined(Meteor.settings.public.sandbox) && Meteor.settings.public.sandbox && userId == 'CRON') {
        return false;
    }

    const _p0 = (side == 'Buy' ? quantity : value.times(quantity));
    const _p1 = (side == 'Buy' ? value.times(quantity) : quantity);
    
    const _product = String(InstrumentSymbol).split('_');
    const balanceSide = (side == 'Buy' ? _product[0] : _product[1]);
    const inTradeSide = (side == 'Buy' ? _product[1] : _product[0]);
    
    // console.log("1 " + side + ": balanceSide " + balanceSide + " " + _p0, "inTradeSide " +  inTradeSide + " " + _p1 + " for " + userId);
    
    const DeferredInTrade = product.findOne({ ProductSymbol: inTradeSide }).Deferred;
    const DeferredBalance = product.findOne({ ProductSymbol: balanceSide }).Deferred;
    
    let currentBalance = balance.findOne({ UserId: userId, ProductSymbol: balanceSide }, { fields: { Balance: 1 } });
    const currentInTrade = DeferredInTrade ? { InTrade: Decimal(0) } : balance.findOne({ UserId: userId, ProductSymbol: inTradeSide }, { fields: { InTrade: 1 } });
    
    if (_.isUndefined(currentInTrade)) {
        throw new Meteor.Error('Not valid InTrade condition for balance changing');
    }
    
    // This case possible if the user the first time buy an asset
    if (_.isUndefined(currentBalance)) {
        currentBalance = { Balance: Decimal('0') };
    }
    
    // console.log("2 " + side + " current: balanceSide " + balanceSide + " " + currentBalance.Balance, "inTradeSide " +  inTradeSide + " " + currentInTrade.InTrade);
    
    const newBalance = DeferredBalance ? Decimal('0') : currentBalance.Balance.add(_p0);
    const newInTrade = currentInTrade.InTrade.sub(_p1);
    
    // console.log("3 " + side + " new: balanceSide " + balanceSide + " " + newBalance, "inTradeSide " +  inTradeSide + " " + newInTrade);
    
    // console.log("4 fee " + fee[0] + " is:" + fee[1]);

    transaction.insert({
        UserId: userId,
        Credit: Decimal('0'),
        Debit: _p0,
        TransactionType: 'Trade', // ['Fee', 'Trade', 'Other', 'Reverse', 'Hold'],
        ReferenceId: tradeId,
        ReferenceType: 'Trade',
        ProductSymbol: balanceSide,
        Balance: newBalance,
        TimeStamp: currentTime,
    }, function(err) {
        if (err) {
            console.log(err);
            return null;
        }
        if (!DeferredInTrade) {
            balance.update({ UserId: userId, ProductSymbol: inTradeSide },
                { $set: { InTrade: newInTrade } });
        }
        if (!DeferredBalance) {
            // here can be the case when user buy an asset the first time
            balance.upsert({ UserId: userId, ProductSymbol: balanceSide },
                { $set: { Balance: newBalance } }, function () {
                    let currentBalanceFee;
                    if (fee[1] != 'X') {
                        if (balanceSide == fee[1]) {
                            currentBalanceFee = { Balance: newBalance };
                        } else {
                            currentBalanceFee = balance.findOne({ UserId: userId, ProductSymbol: fee[1] }, { fields: { Balance: 1 } });
                        }
                    }
                    if (_.isUndefined(currentBalanceFee)) {
                        currentBalanceFee = { Balance: Decimal('0') };
                    }
                    const newBalanceFee = currentBalanceFee.Balance.sub(fee[0]);
                    transaction.insert({
                        UserId: userId,
                        Credit: fee[0],
                        Debit: Decimal('0'),
                        TransactionType: 'Fee', // ['Fee', 'Trade', 'Other', 'Reverse', 'Hold'],
                        ReferenceId: tradeId,
                        ReferenceType: 'Trade',
                        ProductSymbol: fee[1],
                        Balance: newBalanceFee,
                        TimeStamp: currentTime,
                    }, function(err) {
                        if (err) {
                            console.log(err);
                            return null;
                        }
                        balance.update({ UserId: userId, ProductSymbol: fee[1] },
                            { $set: { Balance: newBalanceFee } });
                        return null;
                    });
                });
        } else {
            let currentBalanceFee;
            if (fee[1] != 'X') {
                if (balanceSide == fee[1]) {
                    currentBalanceFee = { Balance: newBalance };
                } else {
                    currentBalanceFee = balance.findOne({ UserId: userId, ProductSymbol: fee[1] }, { fields: { Balance: 1 } });
                }
            }
            if (_.isUndefined(currentBalanceFee)) {
                currentBalanceFee = { Balance: Decimal('0') };
            }
            const newBalanceFee = currentBalanceFee.Balance.sub(fee[0]);
            transaction.insert({
                UserId: userId,
                Credit: fee[0],
                Debit: Decimal('0'),
                TransactionType: 'Fee', // ['Fee', 'Trade', 'Other', 'Reverse', 'Hold'],
                ReferenceId: tradeId,
                ReferenceType: 'Trade',
                ProductSymbol: fee[1],
                Balance: newBalanceFee,
                TimeStamp: currentTime,
            }, function(err) {
                if (err) {
                    console.log(err);
                    return null;
                }
                balance.update({ UserId: userId, ProductSymbol: fee[1] },
                    { $set: { Balance: newBalanceFee } });
                return null;
            });
        }
        return null;
    });
    return null;
};

const holdBalance = function(userId, productSymbol, amount, ref, type) {
    if (!_.isUndefined(Meteor.settings.public.sandbox) && Meteor.settings.public.sandbox && userId == 'CRON') {
        return false;
    }
  
    const _product = product.findOne({ ProductSymbol: productSymbol });

    // we must allow placing deferred order without holding
    if (_product.Deferred) {
        return null;
    }
  
    if (_.isUndefined(balance.findOne({ UserId: userId, ProductSymbol: productSymbol }))) {
        throw new Meteor.Error("You don't have enough balance");
    }
  
    const _currentBalance = balance.findOne({ UserId: userId, ProductSymbol: productSymbol });
    
    if (_.isUndefined(_currentBalance.Balance)) {
        throw new Meteor.Error("You don't have enough balance");
    }
    
    const newBalance = _currentBalance.Balance.sub(amount);
    const newInTrade = _currentBalance.InTrade.add(amount);
  
    if (newBalance.lt(0)) {
        throw new Meteor.Error("You don't have enough balance");
    }
  
    transaction.insert({
        UserId: userId,
        Credit: amount,
        Debit: Decimal('0'),
        TransactionType: 'Hold',
        ReferenceId: ref,
        ReferenceType: type,
        ProductSymbol: productSymbol,
        Balance: newBalance,
        TimeStamp: new Date().getTime(),
    }, function(err) {
        if (!err) {
            balance.update({ UserId: userId, ProductSymbol: productSymbol },
                { $set: { Balance: newBalance, InTrade: newInTrade, TimeStamp: new Date().getTime() } });
        }
    });
    return null;
};

const reverseBalance = function(userId, productSymbol, amount, ref, type) {
    if (!_.isUndefined(Meteor.settings.public.sandbox) && Meteor.settings.public.sandbox && userId == 'CRON') {
        return false;
    }
    
    const _product = product.findOne({ ProductSymbol: productSymbol });

    // we must not allow reversing balance on deferred order
    if (_product.Deferred) {
        return null;
    }

    const _currentBalance = balance.findOne({ UserId: userId, ProductSymbol: productSymbol });
    const newBalance = _currentBalance.Balance.add(amount);
    const newInTrade = _currentBalance.InTrade.sub(amount);
    
    if (newBalance.lte(0)) {
        throw new Meteor.Error("You don't have enough balance");
    }
    
    transaction.insert({
        UserId: userId,
        Credit: Decimal('0'),
        Debit: amount,
        TransactionType: 'Reverse',
        ReferenceId: ref,
        ReferenceType: type,
        ProductSymbol: productSymbol,
        Balance: newBalance,
        TimeStamp: new Date().getTime(),
    }, function() {
        balance.update({ UserId: userId, ProductSymbol: productSymbol },
            { $set: { Balance: newBalance, InTrade: newInTrade, TimeStamp: new Date().getTime() } });
    });
    return null;
};

const getCurrentPriority = function() {
    const cd = new Date();
    return cd.getFullYear() * 800 + (cd.getMonth() + 1) * 700 + cd.getDay() * 600 + cd.getHours() * 500 + cd.getMinutes() * 400 + cd.getSeconds() * 300 + cd.getMilliseconds();
};

const _fillAnyOrderType = function(docArg, orderExecutionArg, cb = () => {}) {
    let doc = docArg;
    let orderExecution = orderExecutionArg;
    const _updateParametrs = {
        flag: false, orderExecution: {}, order: {}, propagation: false,
    };
    
    const _product = String(doc.InstrumentSymbol).split('_');
    
    const quoteProduct = product.findOne({ ProductSymbol: _product[1] });
    
    if (doc.Quantity.gt(orderExecution.Quantity)) {
        _updateParametrs.flag = true;
        
        _updateParametrs.orderExecution.OrderState = 'FullyExecuted';
        _updateParametrs.orderExecution.ChangeReason = 'Trade';
        _updateParametrs.orderExecution.Quantity = Decimal('0');
        _updateParametrs.orderExecution.QuantityExecuted = !orderExecution.QuantityExecuted.eq('0') ? orderExecution.QuantityExecuted.add(orderExecution.Quantity) : orderExecution.Quantity;
        
        _updateParametrs.order.OrderState = 'Working';
        _updateParametrs.order.ChangeReason = 'Trade';
        _updateParametrs.order.Quantity = doc.Quantity.sub(orderExecution.Quantity);
        _updateParametrs.order.QuantityExecuted = !doc.QuantityExecuted.eq('0') ? doc.QuantityExecuted.add(orderExecution.Quantity) : orderExecution.Quantity;
        // for market type
        _updateParametrs.order.Price = orderExecution.LimitPrice;
        _updateParametrs.orderExecution.Price = orderExecution.LimitPrice;
        
        // for trade record
        _updateParametrs.TradeQuantity = orderExecution.Quantity;
        
        _updateParametrs.propagation = true;
        // console.log('propagate only this');
    }
    
    if (doc.Quantity.lt(orderExecution.Quantity)) {
        _updateParametrs.flag = true;
        
        _updateParametrs.order.OrderState = 'FullyExecuted';
        _updateParametrs.order.ChangeReason = 'Trade';
        _updateParametrs.order.Quantity = Decimal('0');
        _updateParametrs.order.QuantityExecuted = !doc.QuantityExecuted.eq('0') ? doc.QuantityExecuted.add(orderExecution.Quantity) : doc.Quantity;
        // for market type
        _updateParametrs.order.Price = orderExecution.LimitPrice;
        _updateParametrs.orderExecution.Price = orderExecution.LimitPrice;
        
        _updateParametrs.orderExecution.OrderState = 'Working';
        _updateParametrs.orderExecution.ChangeReason = 'Trade';
        _updateParametrs.orderExecution.Quantity = orderExecution.Quantity.minus(doc.Quantity);
        _updateParametrs.orderExecution.QuantityExecuted = !orderExecution.QuantityExecuted.eq('0') ? orderExecution.QuantityExecuted.add(doc.Quantity) : doc.Quantity;
        
        // for trade record
        _updateParametrs.TradeQuantity = doc.Quantity;
    }
    
    if (doc.Quantity.eq(orderExecution.Quantity)) {
        _updateParametrs.flag = true;
        
        _updateParametrs.orderExecution.OrderState = 'FullyExecuted';
        _updateParametrs.orderExecution.ChangeReason = 'Trade';
        _updateParametrs.orderExecution.Quantity = Decimal('0');
        _updateParametrs.orderExecution.QuantityExecuted = !orderExecution.QuantityExecuted.eq('0') ? orderExecution.QuantityExecuted.add(doc.Quantity) : doc.Quantity;
        
        _updateParametrs.order.OrderState = 'FullyExecuted';
        _updateParametrs.order.ChangeReason = 'Trade';
        _updateParametrs.order.Quantity = Decimal('0');
        _updateParametrs.order.QuantityExecuted = !doc.QuantityExecuted.eq('0') ? doc.QuantityExecuted.add(orderExecution.Quantity) : doc.Quantity;
        // for market type
        _updateParametrs.order.Price = orderExecution.LimitPrice;
        _updateParametrs.orderExecution.Price = orderExecution.LimitPrice;

        // for trade record
        _updateParametrs.TradeQuantity = orderExecution.Quantity;
    }

    // check FOK case
    if (doc.TimeInForce == 'FOK' && _updateParametrs.order.OrderState != 'FullyExecuted') {
        order.update({ _id: doc._id }, { $set: { OrderState: 'Expired' } }, function() {
            // return the working state for the opposite order
            order.update({ _id: orderExecution._id }, { $set: { OrderState: 'Working' } }, function() {
                cb();
            });
        });
        return null;
    }
    
    // ? What for this case - how this order can be in DB?
    if (orderExecution.TimeInForce == 'FOK' && _updateParametrs.orderExecution.OrderState != 'FullyExecuted') {
        order.update({ _id: orderExecution._id }, { $set: { OrderState: 'Expired' } }, function() {
            // return the working state for the opposite order
            order.update({ _id: doc._id }, { $set: { OrderState: 'Working' } }, function() {
                cb();
            });
        });
        return null;
    }
    
    if (doc.OrderType == 'Market') {
        try {
            const _productSymbol = doc.Side === 'Buy' ? _product[1] : _product[0];
            const amount = doc.Side === 'Buy' ? _updateParametrs.order.Price.times(_updateParametrs.TradeQuantity) : doc.Quantity;
            holdBalance(doc.UserId, _productSymbol, amount, doc._id, 'Order');
        } catch (e) {
            order.update({ _id: doc._id }, { $set: { OrderState: 'Expired' } }, function() {
                // return the working state for the opposite order
                order.update({ _id: orderExecution._id }, { $set: { OrderState: 'Working' } }, function() {
                    cb(e.message);
                });
            });
            return null;
        }
    }
    
    const _executionId = Random.id();
    
    const lastPrice = price_latest.findOne({ InstrumentSymbol: doc.InstrumentSymbol }) ? price_latest.findOne({ InstrumentSymbol: doc.InstrumentSymbol }).Price : Decimal('0');
    
    let _direction;
    if (lastPrice.lt(orderExecution.LimitPrice)) {
        _direction = 'UpTick';
    } else if (lastPrice.eq(orderExecution.LimitPrice)) {
        _direction = 'NoChange';
    } else {
        _direction = 'DownTick';
    }
    
    const _fee = _getFeeByOrder(Object.assign(doc, _updateParametrs.order), Object.assign(orderExecution, _updateParametrs.orderExecution));
    
    // Async flow
    asyncX.waterfall([
        // update order
        function(callback) {
            order.update({ _id: doc._id }, { $set: _updateParametrs.order }, function(error) {
                doc = Object.assign(doc, _updateParametrs.order);
                callback(error); // error, [results]
            });
        },
        // create new trade for order
        function(callback) {
            const totalValue = _updateParametrs.TradeQuantity.times(orderExecution.LimitPrice);
            const currentTime = new Date().getTime();
            trade.insert({
                UserId: doc.UserId,
                InstrumentSymbol: doc.InstrumentSymbol,
                Side: doc.Side,
                Quantity: _updateParametrs.TradeQuantity,
                RemainingQuantity: doc.Quantity,
                Price: orderExecution.LimitPrice,
                Value: totalValue,
                TradeBid: orderExecution.LimitPrice,
                TradeAsk: (doc.LimitPrice ? doc.LimitPrice : orderExecution.LimitPrice), // market order can have 0 here
                TradeMidpoint: doc.LimitPrice ? orderExecution.LimitPrice.add(doc.LimitPrice).div(2) : orderExecution.LimitPrice, // @TODO market order can have 0 here
                Fee: _fee.maker[0],
                FeeProductSymbol: _fee.maker[1],
                OrderId: doc._id,
                ClientOrderId: doc.ClientOrderId ? doc.ClientOrderId : '',
                ExecutionId: _executionId,
                Direction: _direction,
                TradeState: quoteProduct.Deferred ? 'Deferred' : 'Closed',
                ExecutionTime: currentTime,
                TradeTime: quoteProduct.Deferred ? 0 : currentTime,
                IsBlockTrade: doc.OrderType == 'BlockTrade',
                Initial: true,
            }, function (err, _id) {
                if (!quoteProduct.Deferred) {
                    // need to update balances for the maker, also need to decrease it on fee
                    _changeBalanceByTrade(doc.UserId, doc.InstrumentSymbol, doc.Side, _id, orderExecution.LimitPrice, _updateParametrs.TradeQuantity, _fee.maker);
                }
                callback(err); // error, [results]
            });
        },
        // update orderExecution
        function(callback) {
            // @TODO need to update balances for the taker, also need to decrease it on fee
            // console.log('propagate orderExecution ' + orderExecution._id + " State " + _updateParametrs.orderExecution.OrderState);
            order.update({ _id: orderExecution._id }, { $set: _updateParametrs.orderExecution }, function(error) {
                orderExecution = Object.assign(orderExecution, _updateParametrs.orderExecution);
                callback(error); // error, [results]
            });
        },
        // create new trade for orderExecution
        function(callback) {
            const currentTime = new Date().getTime();
            const totalValue = _updateParametrs.TradeQuantity.times(orderExecution.LimitPrice);
            trade.insert({
                UserId: orderExecution.UserId,
                InstrumentSymbol: orderExecution.InstrumentSymbol,
                Side: orderExecution.Side,
                Quantity: _updateParametrs.TradeQuantity,
                RemainingQuantity: orderExecution.Quantity,
                Price: orderExecution.LimitPrice,
                Value: totalValue,
                TradeBid: orderExecution.LimitPrice,
                TradeAsk: (doc.LimitPrice ? doc.LimitPrice : orderExecution.LimitPrice), // market order can have 0 here
                TradeMidpoint: doc.LimitPrice ? orderExecution.LimitPrice.add(doc.LimitPrice).div(2) : orderExecution.LimitPrice, // @TODO market order can have 0 here
                Fee: _fee.taker[0],
                FeeProductSymbol: _fee.taker[1],
                OrderId: orderExecution._id,
                ClientOrderId: orderExecution.ClientOrderId ? orderExecution.ClientOrderId : '',
                ExecutionId: _executionId,
                Direction: _direction,
                TradeState: quoteProduct.Deferred ? 'Deferred' : 'Closed',
                ExecutionTime: currentTime,
                TradeTime: quoteProduct.Deferred ? 0 : currentTime,
                IsBlockTrade: orderExecution.OrderType == 'BlockTrade',
                Initial: false,
            }, function(err, _id) {
                if (!quoteProduct.Deferred) {
                    // need to update balances for the maker, also need to decrease it on fee
                    _changeBalanceByTrade(orderExecution.UserId, orderExecution.InstrumentSymbol, orderExecution.Side, _id, orderExecution.LimitPrice, _updateParametrs.TradeQuantity, _fee.taker);
                } else {
                    const _productOE = String(orderExecution.InstrumentSymbol).split('_');
                    if (doc.Side == 'Buy') {
                        createNewTalk(orderExecution.UserId, doc.UserId, 'Trade', _executionId, { value: totalValue, product: _productOE[1] }, { value: _updateParametrs.TradeQuantity, product: _productOE[0] });
                    } else {
                        createNewTalk(doc.UserId, orderExecution.UserId, 'Trade', _executionId, { value: totalValue, product: _productOE[1] }, { value: _updateParametrs.TradeQuantity, product: _productOE[0] });
                    }
                }
                callback(err); // error, [results]
            });
        },
    ], function (error) {
        // console.log(err, result);
        if (!error && _updateParametrs.propagation) {
            // Add job to matching engine collection
            // console.log('propagate ' + doc._id + " State " + doc.OrderState);
            new Job(MatchingEngineJobs, 'Fill', { OrderId: doc._id }).priority(getCurrentPriority()).save();
        }
        cb();
    });
    return null;
};

const tryFillOrder = function(OrderId, cb = () => {}) {
    const doc = order.findAndModify({
        query: { _id: OrderId, OrderState: 'Working', OrderType: { $in: ['Market', 'Limit'] } },
        update: { $set: { OrderState: 'InProcess' } },
    });
    
    if (doc == null) {
        cb();
        return;
    }
    
    if (_.isUndefined(instrument.findOne({ InstrumentSymbol: doc.InstrumentSymbol }))
        || instrument.findOne({ InstrumentSymbol: doc.InstrumentSymbol }).SessionStatus != 'Running') {
        cb();
        return;
    }
    
    if (doc.Quantity.eq('0')) {
        order.update({ _id: doc._id, OrderState: 'InProcess' }, { $set: { OrderState: 'Working' } }, function() {
            cb();
        });
        return;
    }

    let contraSide = {};
    let orderExecution;
    switch (doc.OrderType) {
    case 'Market':
        if (doc.Side == 'Buy') {
            contraSide = { Parameters: { Side: 'Sell' }, Sort: { LimitPrice: 1, ReceiveTime: 1 } };
        } else {
            contraSide = { Parameters: { Side: 'Buy' }, Sort: { LimitPrice: -1, ReceiveTime: 1 } };
        }
            
        /**
         *  Example:
         *  Want to buy 10 coins.
         *  In the order book sell 7 coins by 0.8$ each.
        * */
        orderExecution = order.findAndModify({
            query: Object.assign({
                OrderType: 'Limit',
                InstrumentSymbol: doc.InstrumentSymbol,
                OrderState: 'Working',
            }, contraSide.Parameters),
            sort: contraSide.Sort,
            fields: {
                UserId: 1,
                InstrumentSymbol: 1,
                Side: 1,
                LimitPrice: 1,
                Quantity: 1,
                OrderType: 1,
                ClientOrderId: 1,
                TimeInForce: 1,
                QuantityExecuted: 1,
            },
            update: { $set: { OrderState: 'InProcess' } },
        });

        if (orderExecution && orderExecution != null) {
            _fillAnyOrderType(doc, orderExecution, cb);
        } else {
            order.update({ _id: doc._id }, { $set: { OrderState: 'Expired' } }, function() {
                cb();
            });
            break;
        }
        break;
    case 'Limit':
        if (doc.Side == 'Buy') {
            contraSide = { Parameters: { Side: 'Sell', LimitPrice: { $lte: doc.LimitPrice } }, Sort: { LimitPrice: 1, ReceiveTime: 1 } };
        } else {
            contraSide = { Parameters: { Side: 'Buy', LimitPrice: { $gte: doc.LimitPrice } }, Sort: { LimitPrice: -1, ReceiveTime: 1 } };
        }
            
        /**
         *  Example:
         *  Want to buy 10 coins by 1$ each.
         *  In the order book sell 7 coint by 0.9$ each.
        * */
        orderExecution = order.findAndModify({
            query: Object.assign({
                OrderType: 'Limit',
                InstrumentSymbol: doc.InstrumentSymbol,
                OrderState: 'Working',
            }, contraSide.Parameters),
            sort: contraSide.Sort,
            fields: {
                UserId: 1,
                InstrumentSymbol: 1,
                Side: 1,
                LimitPrice: 1,
                Quantity: 1,
                OrderType: 1,
                ClientOrderId: 1,
                TimeInForce: 1,
                QuantityExecuted: 1,
            },
            update: { $set: { OrderState: 'InProcess' } },
        });

        if (orderExecution && orderExecution != null) {
            // console.log('orderExecution state after modify ', orderExecution );
            // console.log('doc state after modify ', doc._id, doc.OrderState );
            _fillAnyOrderType(doc, orderExecution, cb);
        } else {
            switch (doc.TimeInForce) {
            case 'IOC':
            case 'FOK':
                order.update({ _id: doc._id }, { $set: { OrderState: 'Expired' } }, function() {
                    cb();
                });
                break;
            default:
                order.update({ _id: doc._id }, { $set: { OrderState: 'Working' } }, function() {
                    cb();
                });
                break;
            }
        }
        break;
    default:
        // Above exists check for orderType, just simple fallback for future
        order.update({ _id: doc._id }, { $set: { OrderState: 'Working' } }, function() {
            cb();
        });
    }
};

const closeTalkConfirmTrade = function(_executionId) {
    const _trade = trade.findOne({ ExecutionId: _executionId, Initial: true, TradeState: 'Deferred' });
    const _tradeExecution = trade.findOne({ ExecutionId: _executionId, Initial: false, TradeState: 'Deferred' });
    
    if (_.isUndefined(_trade) || _.isUndefined(_tradeExecution)) {
        throw new Meteor.Error('both trades must be deferred');
    }
    
    const _product = instrument.findOne({ InstrumentSymbol: _trade.InstrumentSymbol }).Product1Symbol;
    const _productSymbol = product.findOne({ ProductSymbol: _product });
    
    const _fee = _productSymbol.NoFees ? { maker: [Decimal('0'), 'X'], taker: [Decimal('0'), 'X'] } : _getFeeByOrder(_trade, _tradeExecution);
    
    trade.update({ _id: { $in: [_trade._id, _tradeExecution._id] }, TradeState: 'Deferred' },
        { $set: { TradeState: 'Closed', TradeTime: new Date().getTime() } }, { multi: true }, function () {
            _changeBalanceByTrade(_trade.UserId, _trade.InstrumentSymbol, _trade.Side, _trade._id, _trade.Price, _trade.Quantity, _fee.maker);
            _changeBalanceByTrade(_tradeExecution.UserId, _tradeExecution.InstrumentSymbol, _tradeExecution.Side, _tradeExecution._id, _tradeExecution.Price, _tradeExecution.Quantity, _fee.taker);
        });
};

const closeTalkRefuseTrade = function(_executionId) {
    const _trade = trade.findOne({ ExecutionId: _executionId, Initial: true, TradeState: 'Deferred' });
    const _tradeExecution = trade.findOne({ ExecutionId: _executionId, Initial: false, TradeState: 'Deferred' });
    
    if (_.isUndefined(_trade) || _.isUndefined(_tradeExecution)) {
        throw new Meteor.Error('both trades must be deferred');
    }
    
    trade.update({ _id: { $in: [_trade._id, _tradeExecution._id] }, TradeState: 'Deferred' },
        { $set: { TradeState: 'Refused', TradeTime: new Date().getTime() } }, { multi: true }, function () {
            const _productTrade = String(_trade.InstrumentSymbol).split('_');
            let productSymbolTrade;
            let amountTrade;
            if (_trade.Side == 'Buy') {
                [, productSymbolTrade] = _productTrade;
                amountTrade = _trade.Value;
            } else {
                [productSymbolTrade] = _productTrade;
                amountTrade = _trade.Quantity;
            }
        
            if (!product.findOne({ ProductSymbol: productSymbolTrade }).Deferred) {
                reverseBalance(_trade.UserId, productSymbolTrade, amountTrade, _trade.OrderId, 'Order');
            }
        
            const _productTradeExecution = String(_tradeExecution.InstrumentSymbol).split('_');
            let productSymbolTradeExecution;
            let amountTradeExecution;
            if (_tradeExecution.Side == 'Buy') {
                [, productSymbolTradeExecution] = _productTradeExecution;
                amountTradeExecution = _tradeExecution.Value;
            } else {
                [productSymbolTradeExecution] = _productTradeExecution;
                amountTradeExecution = _tradeExecution.Quantity;
            }
        
            if (!product.findOne({ ProductSymbol: productSymbolTradeExecution }).Deferred) {
                reverseBalance(_tradeExecution.UserId, productSymbolTradeExecution, amountTradeExecution, _tradeExecution.OrderId, 'Order');
            }
        });
};

const resolveDisputeTrade = function(_executionId, approvedAmount) {
    const _trade = trade.findOne({ ExecutionId: _executionId, Side: 'Sell', TradeState: 'Deferred' });
    const _tradeExecution = trade.findOne({ ExecutionId: _executionId, Side: 'Buy', TradeState: 'Deferred' });
    
    if (_.isUndefined(_trade) || _.isUndefined(_tradeExecution)) {
        throw new Meteor.Error('both trades must be deferred');
    }
    
    let amountTrade = Decimal(approvedAmount);

    if (amountTrade.lt(Decimal('0'))) {
        amountTrade = Decimal('0');
    }
    
    if (amountTrade.gt(_trade.Quantity)) {
        amountTrade = _trade.Quantity;
    }
    
    // Async flow
    asyncX.waterfall([
        // update _trade
        function(callback) {
            const _updates = {
                TradeState: 'Closed',
                TradeTime: new Date().getTime(),
            };

            if (!amountTrade.eq(0)) {
                _updates.Quantity = amountTrade;
                _updates.RemainingQuantity = _trade.RemainingQuantity.add(_trade.Quantity.sub(amountTrade));
                _updates.Value = amountTrade.times(_trade.Price);
            }

            trade.update({ _id: _trade._id, TradeState: 'Deferred' }, { $set: _updates },
                function(err) {
                    callback(err); // error, [results]
                });
        },
        function(callback) {
            if (!amountTrade.eq(0)) {
                reverseBalance(_trade.UserId, _trade.InstrumentSymbol.split('_')[0], _trade.Quantity.sub(amountTrade), _trade.OrderId, 'Order');
                _changeBalanceByTrade(_trade.UserId, _trade.InstrumentSymbol, _trade.Side, _trade._id, _trade.Price, amountTrade, [Decimal('0'), 'X']);
                callback(); // error, [results]
            }
        },
        // Udpdate _tradeExecution
        function(callback) {
            const _updates = {
                TradeState: 'Closed',
                TradeTime: new Date().getTime(),
            };

            if (!amountTrade.eq(0)) {
                _updates.Quantity = amountTrade;
                _updates.RemainingQuantity = _trade.RemainingQuantity.add(_trade.Quantity.sub(amountTrade));
                _updates.Value = amountTrade.times(_trade.Price);
            }

            trade.update({ _id: _tradeExecution._id, TradeState: 'Deferred' }, { $set: _updates },
                function(err) {
                    callback(err); // error, [results]
                });
        },
        // create new trade for order
        function(callback) {
            if (!amountTrade.eq(0)) {
                _changeBalanceByTrade(_tradeExecution.UserId, _tradeExecution.InstrumentSymbol, _tradeExecution.Side, _tradeExecution._id, _tradeExecution.Price, amountTrade, [Decimal('0'), 'X']);
                callback(); // error, [results]
            }
        },
    ]);
};

export {
    getCategoryListInstrumentSymbol, getCategoryByInstrumentSymbol, getDepthData, updatePrice24,
    updateLatestPrice, updateTicker, updateAveragePrice,
    calculateAlgoOrders, tryFillOrder, holdBalance, reverseBalance,
    _changeBalanceByTrade, getCurrentPriority, _getFeeByOrder,
    closeTalkRefuseTrade, closeTalkConfirmTrade, resolveDisputeTrade,
};

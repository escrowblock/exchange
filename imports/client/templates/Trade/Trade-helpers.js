import { Template } from 'meteor/templating';
import { ChartComponent, DepthComponent } from 'meteor/logvik:react-stockcharts/client';
import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { Decimal } from 'meteor/mongo-decimal';
import { getDepthData } from '/imports/tools';
import {
    ticker, order, balance, trade, price_latest,
} from '/imports/collections';
import { moment } from 'meteor/momentjs:moment';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

Template.Trade.helpers({
    ChartComponent() {
        return ChartComponent;
    },
    GetChartData() {
        const out = [];
        const tickers = ticker.find({ InstrumentSymbol: Session.get('currentInstrumentSymbol'), Interval: Session.get('currentInterval') }, { sort: { Date: 1 } }).fetch();

        let startOf;
        if (_.indexOf(['1m', '3m', '5m', '15m', '30m'], Session.get('currentInterval')) != -1) {
            startOf = 'minute';
        }
        if (_.indexOf(['1h', '2h', '4h', '6h', '8h', '12h'], Session.get('currentInterval')) != -1) {
            startOf = 'hour';
        }
        if (_.indexOf(['1d', '3d'], Session.get('currentInterval')) != -1) {
            startOf = 'day';
        }
        if (_.indexOf(['1w'], Session.get('currentInterval')) != -1) {
            startOf = 'week';
        }
        if (_.indexOf(['1M'], Session.get('currentInterval')) != -1) {
            startOf = 'month';
        }
        const intervalParams = [Session.get('currentInterval').substr(0, Session.get('currentInterval').length - 1), Session.get('currentInterval').substr(-1, 1)];
    
        const countTickers = tickers.length;
    
        _.map(tickers, function(object, index) {
            out.push(object);

            let initialDate = moment.utc(new Date(object.Date));
            let endDate;
            if (index + 1 == countTickers) {
                endDate = moment.utc(new Date()).startOf(startOf);
            } else {
                endDate = tickers[index + 1].Date;
            }
      
            let i = 0;
            while (initialDate.valueOf() <= endDate.valueOf()) {
                const _temp = Object.assign({}, object);
                _temp._id = i;
                _temp.High = _temp.Close;
                _temp.InsideAskPrice = _temp.Close;
                _temp.InsideBidPrice = _temp.Close;
                _temp.Low = _temp.Close;
                _temp.Open = _temp.Close;
                _temp.Volume = 0;
                initialDate = initialDate.add(intervalParams[0], intervalParams[1]);
                _temp.Date = initialDate.valueOf();
                i += 1;
                out.push(_temp);
            }
        });

        return out;
    },
    DepthComponent() {
        return DepthComponent;
    },
    GetDepthData() {
        if (Session.get('currentInstrumentSymbol')) {
            const data = getDepthData(Session.get('currentInstrumentSymbol'));
            return data;
        }
        return [];
    },
    showDepth() {
        return Session.get('showDepth');
    },
    LeftSymbol() {
        return Session.get('currentInstrumentSymbol') ? String(Session.get('currentInstrumentSymbol')).split('_')[0] : '*';
    },
    RightSymbol() {
        return Session.get('currentInstrumentSymbol') ? String(Session.get('currentInstrumentSymbol')).split('_')[1] : '*';
    },
    BookStatBuy() {
        // return order.find({"InstrumentSymbol": Session.get("currentInstrumentSymbol"), "Side": "Buy", "OrderType": "Limit", "OrderState": {"$in": ["Working", "InProcess"]}}, {"sort": {"Price": -1}, "limit": 50});
    
        const result = [];
        // "sort": {"Price": -1}  @TODO not working now for Decimal
        const _orders = order.find({
            InstrumentSymbol: Session.get('currentInstrumentSymbol'), Side: 'Buy', OrderType: 'Limit', OrderState: { $in: ['Working', 'InProcess'] },
        }, { limit: 50 }).fetch();
    
        _orders.sort(function (a, b) {
            if (a.Price.lt(b.Price)) {
                return 1;
            }
            if (a.Price.gt(b.Price)) {
                return -1;
            }
            return 0;
        });
    
        _orders.map(function(item) {
            if (!_.isUndefined(Session.get('currentInstrumentSymbolDecimal')) && Session.get('currentInstrumentSymbolDecimal') != '-') {
                const price = Decimal(Decimal(item.Price).toFixed(+Number(Session.get('currentInstrumentSymbolDecimal')), Decimal.ROUND_DOWN));
                if (result.length > 0 && price.eq(result[result.length - 1].Price)) {
                    result[result.length - 1].Quantity = Decimal(result[result.length - 1].Quantity).plus(item.Quantity);
                } else {
                    result.push({ Quantity: item.Quantity, Price: price, ApproxPrice: item.Price });
                }
            } else {
                const price = item.Price;
                if (result.length > 0 && price.eq(result[result.length - 1].Price)) {
                    result[result.length - 1].Quantity = Decimal(result[result.length - 1].Quantity).plus(item.Quantity);
                } else {
                    result.push({ Quantity: item.Quantity, Price: price, ApproxPrice: item.Price });
                }
            }
            return null;
        });
    
        return result;
    },
    currentBalance(type, showSymbol) {
        if (Session.get('currentInstrumentSymbol') && Meteor.userId()) {
            let symbol = '';
            switch (type) {
            case 'Buy':
                [, symbol] = String(Session.get('currentInstrumentSymbol')).split('_');
                break;
            case 'Sell':
                [symbol] = String(Session.get('currentInstrumentSymbol')).split('_');
                break;
            default:
                break;
            }
            if (symbol && balance.findOne({ UserId: Meteor.userId(), ProductSymbol: symbol })) {
                if (showSymbol) {
                    return `${balance.findOne({ UserId: Meteor.userId(), ProductSymbol: symbol }).Balance} ${symbol}`;
                }
                return balance.findOne({ UserId: Meteor.userId(), ProductSymbol: symbol }).Balance;
            }
            return showSymbol ? `* ${symbol}` : symbol;
        }
        return '*';
    },
    BookStatSell() {
        // return order.find({"InstrumentSymbol": Session.get("currentInstrumentSymbol"), "Side": "Sell", "OrderType": "Limit", "OrderState": {"$in": ["Working", "InProcess"]}}, {"sort": {"Price": -1}, "limit": 50})

        const result = [];
        // "sort": {"Price": -1}  @TODO not working now for Decimal
        const _orders = order.find({
            InstrumentSymbol: Session.get('currentInstrumentSymbol'), Side: 'Sell', OrderType: 'Limit', OrderState: { $in: ['Working', 'InProcess'] },
        }, { limit: 50 }).fetch();
    
        _orders.sort(function (a, b) {
            if (a.Price.lt(b.Price)) {
                return 1;
            }
            if (a.Price.gt(b.Price)) {
                return -1;
            }
            return 0;
        });
    
        _orders.map(function(item) {
            if (!_.isUndefined(Session.get('currentInstrumentSymbolDecimal')) && Session.get('currentInstrumentSymbolDecimal') != '-') {
                const price = Decimal(Decimal(item.Price).toFixed(+Number(Session.get('currentInstrumentSymbolDecimal')), Decimal.ROUND_DOWN));
                if (result.length > 0 && price.eq(result[result.length - 1].Price)) {
                    result[result.length - 1].Quantity = Decimal(result[result.length - 1].Quantity).plus(item.Quantity);
                } else {
                    result.push({ Quantity: item.Quantity, Price: price, ApproxPrice: item.Price });
                }
            } else {
                const price = item.Price;
                if (result.length > 0 && price.eq(result[result.length - 1].Price)) {
                    result[result.length - 1].Quantity = Decimal(result[result.length - 1].Quantity).plus(item.Quantity);
                } else {
                    result.push({ Quantity: item.Quantity, Price: price, ApproxPrice: item.Price });
                }
            }
            return null;
        });
    
        return result;
    },
    QuantityNumber() {
        return Decimal(this.Quantity).toFixed(4);
    },
    PriceNumber() {
        const price = String(this.Price);
        if (price.indexOf('.') !== -1) {
            return price.substr(0, price.indexOf('.'));
        }
        return price;
    },
    PriceDecimal() {
        let precision = Decimal(this.Price).dp();
        precision = precision || 2;
        const price = String(this.Price);
        if (price.indexOf('.') !== -1) {
            return price.substr(price.indexOf('.') + 1, precision);
        }
        return _.map(_.range(precision), () => '0').join('');
    },
    Result() {
        return Decimal(this.Price).times(this.Quantity).toFixed(4);
    },
    ResultNumber() {
        return Decimal(this.Price).times(this.Quantity).toFixed(4);
    },
    RecentTrades() {
        return trade.find({ InstrumentSymbol: Session.get('currentInstrumentSymbol'), TradeState: 'Closed', Initial: true }, { sort: { TradeTime: -1 }, limit: 100 });
    },
    formatDate (date, format) {
        return date ? moment(date).format(format) : '-';
    },
    MyOpenOrders() {
        const { limitOrder } = Meteor.settings.public;
        const page = Session.get('MyOpenOrdersPage');
        const UserId = Meteor.userId();
        if (page) {
            return order.find({ UserId, InstrumentSymbol: Session.get('currentInstrumentSymbol'), OrderState: { $in: ['Working', 'InProcess'] } }, { sort: { ReceiveTime: -1 }, skip: page * limitOrder, limit: limitOrder });
        }
        return order.find({ UserId, InstrumentSymbol: Session.get('currentInstrumentSymbol'), OrderState: { $in: ['Working', 'InProcess'] } }, { sort: { ReceiveTime: -1 }, limit: limitOrder });
    },
    MyOpenOrdersCount() {
        const { limitOrder } = Meteor.settings.public;
        const page = Session.get('MyOpenOrdersPage');
        const UserId = Meteor.userId();
        if (page) {
            return order.find({ UserId, InstrumentSymbol: Session.get('currentInstrumentSymbol'), OrderState: { $in: ['Working', 'InProcess'] } }, { sort: { ReceiveTime: -1 }, skip: page * limitOrder, limit: limitOrder }).count();
        }
        return order.find({ UserId, InstrumentSymbol: Session.get('currentInstrumentSymbol'), OrderState: { $in: ['Working', 'InProcess'] } }, { sort: { ReceiveTime: -1 }, limit: limitOrder }).count();
    },
    MyOrdersHistory() {
        const { limitOrder } = Meteor.settings.public;
        const page = Session.get('MyOrdersHistoryPage');
        const hide = Session.get('hidePairsOrdersHistory');
        const params = { UserId: Meteor.userId(), OrderState: { $nin: ['Working'] } };
        if (hide && Session.get('currentInstrumentSymbol')) {
            params.InstrumentSymbol = Session.get('currentInstrumentSymbol');
        }
        if (page) {
            return order.find(params, { sort: { ReceiveTime: -1 }, skip: page * limitOrder, limit: limitOrder });
        }
        return order.find(params, { sort: { ReceiveTime: -1 }, limit: limitOrder });
    },
    MyOrdersHistoryCount() {
        const { limitOrder } = Meteor.settings.public;
        const page = Session.get('MyOrdersHistoryPage');
        const hide = Session.get('hidePairsOrdersHistory');
        const params = { UserId: Meteor.userId(), OrderState: { $nin: ['Working'] } };
        if (hide && Session.get('currentInstrumentSymbol')) {
            params.InstrumentSymbol = Session.get('currentInstrumentSymbol');
        }
        if (page) {
            return order.find(params, { sort: { ReceiveTime: -1 }, skip: page * limitOrder, limit: limitOrder }).count();
        }
        return order.find(params, { sort: { ReceiveTime: -1 }, limit: limitOrder }).count();
    },
    MyTradesHistory() {
        const { limitOrder } = Meteor.settings.public;
        const page = Session.get('MyTradesHistoryPage');
        const hide = Session.get('hidePairsTradesHistory');
        let params = {};
        if (Meteor.userId()) {
            params = { UserId: Meteor.userId() };
        } else {
            params = { UserId: -1 };
        }
        if (hide && Session.get('currentInstrumentSymbol')) {
            params.InstrumentSymbol = Session.get('currentInstrumentSymbol');
        }
        if (page) {
            return trade.find(params, { sort: { ExecutionTime: -1 }, skip: page * limitOrder, limit: limitOrder });
        }
        return trade.find(params, { sort: { ExecutionTime: -1 }, limit: limitOrder });
    },
    MyTradesHistoryCount() {
        const { limitOrder } = Meteor.settings.public;
        const page = Session.get('MyTradesHistoryPage');
        const hide = Session.get('hidePairsTradesHistory');
        let params = {};
        if (Meteor.userId()) {
            params = { UserId: Meteor.userId() };
        } else {
            params = { UserId: -1 };
        }
        if (hide && Session.get('currentInstrumentSymbol')) {
            params.InstrumentSymbol = Session.get('currentInstrumentSymbol');
        }
        if (page) {
            return trade.find(params, { sort: { ExecutionTime: -1 }, skip: page * limitOrder, limit: limitOrder }).count();
        }
        return trade.find(params, { sort: { ExecutionTime: -1 }, limit: limitOrder }).count();
    },
    Triggers() {
        switch (this.OrderType) {
        case 'Market':
            return '-';
            // break;
        case 'Limit':
            return '-';
            // break;
        case 'StopMarket':
            return `${TAPi18n.__('Stop price')} ${this.StopPrice}`;
            // break;
        case 'StopLimit':
            return `${TAPi18n.__('Limit price')} ${this.LimitPrice} ${TAPi18n.__('when')} ${TAPi18n.__('Stop price')} ${this.StopPrice}`;
            // break;
        case 'TrailingStopMarket':
            return `${TAPi18n.__('Stop price')} ${this.StopPrice}
${TAPi18n.__('Peg price type')} ${this.PegPriceType}
${TAPi18n.__('Trailing amount')} ${this.TrailingAmount}`;
            // break;
        case 'TrailingStopLimit':
            return `${TAPi18n.__('Limit price')} ${this.LimitPrice} ${TAPi18n.__('when')}
${TAPi18n.__('Stop price')} ${this.StopPrice}
${TAPi18n.__('Peg price type')} ${this.PegPriceType}
${TAPi18n.__('Limit offset')} ${this.LimitOffset}`;
            // break;
        case 'BlockTrade':
            return '-';
            // break;
        default:
            break;
        }
        return '';
    },
    LastPrice() {
        const template = Template.instance();
        const price = price_latest.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        if (price) {
            template.latestPriceDp = Decimal(price.Price).dp();
            template.latestPriceLTN = Decimal(price.Price).lt(0);
            return price.Price;
        }
        return '...';
    },
    DecimalOptions() {
        const template = Template.instance();
        if (template.latestPriceDp) {
            let dp = template.latestPriceDp;
            if (template.latestPriceDp - 4 < 0) {
                dp = 0;
            }
            if (template.latestPriceLTN) {
                dp = 1;
            }
            const _range = _.range(dp, template.latestPriceDp);
            _range.push('-');
            return _range;
        }
        return [0, 1, '-'];
    },
    PriceDirection() {
        const obj = trade.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol'), TradeState: 'Closed', Initial: true }, { sort: { TradeTime: -1 } });
        if (obj) {
            switch (obj.Direction) {
            case 'DownTick':
                return 'down';
                // break;
            case 'UpTick':
                return 'up';
                // break;
            default:
                return '';
                // break;
            }
        } else {
            return '';
        }
    },
});

import { ticker, order, trade } from '/imports/collections';
import { moment } from 'meteor/momentjs:moment';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.publish('ChartData', function(InstrumentSymbol, Interval) {
    check(InstrumentSymbol, String);
    check(Interval, String);
    return ticker.find({ InstrumentSymbol, Interval }, { sort: { Date: -1 }, limit: 100 });
});

Meteor.publish('BookStatBuy', function(InstrumentSymbol) {
    check(InstrumentSymbol, String);
    return order.find({
        InstrumentSymbol, Side: 'Buy', OrderType: 'Limit', OrderState: { $in: ['Working', 'InProcess'] },
    }, { sort: { ReceiveTime: -1 }, limit: 50 });
});

Meteor.publish('BookStatSell', function(InstrumentSymbol) {
    check(InstrumentSymbol, String);
    return order.find({
        InstrumentSymbol, Side: 'Sell', OrderType: 'Limit', OrderState: { $in: ['Working', 'InProcess'] },
    }, { sort: { ReceiveTime: -1 }, limit: 50 });
});

Meteor.publish('RecentTrades', function(InstrumentSymbol) {
    check(InstrumentSymbol, String);
    return trade.find({ InstrumentSymbol, TradeState: 'Closed', Initial: true },
        {
            fields: {
                InstrumentSymbol: 1, Price: 1, Quantity: 1, Initial: 1, TradeState: 'Closed', Direction: 1, TradeTime: 1,
            },
            limit: 100,
        });
});

// Open, for the history, all in total
Meteor.publish('MyOrders', function() {
    const limitOrder = 500;
    return order.find({ UserId: this.userId }, { sort: { ReceiveTime: -1 }, limit: limitOrder });
});

Meteor.publish('MyTrades', function(from, to) {
    const limitTrades = 500;
    const params = { $and: [] };
    if (Number(from).valueOf()) {
        params.$and.push({ TradeTime: { $gte: from } });
    } else {
        params.$and.push({ TradeTime: { $gte: moment.utc().subtract('1', 'M').valueOf() } });
    }
    if (Number(to).valueOf()) {
        params.$and.push({ TradeTime: { $lte: to } });
    }
    return trade.find(Object.assign({ UserId: this.userId }, params), { sort: { TradeTime: -1 }, limit: limitTrades });
});

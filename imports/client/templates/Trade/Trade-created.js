import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.Trade.onCreated(function() {
    const template = this;
  
    template.tracker = Tracker.autorun(function() {
        const currentInstrumentSymbol = Session.get('currentInstrumentSymbol');
        if (!_.isUndefined(currentInstrumentSymbol)) {
            if (Session.get('currentInterval')) {
                template.subsChartData = template.subscribe('ChartData', currentInstrumentSymbol, Session.get('currentInterval'));
            }
            template.subsBookStatBuy = template.subscribe('BookStatBuy', currentInstrumentSymbol);
            template.subsBookStatSell = template.subscribe('BookStatSell', currentInstrumentSymbol);
            template.subsRecentTrades = template.subscribe('RecentTrades', currentInstrumentSymbol);
            if (Meteor.userId()) {
                template.subsMyOrders = template.subscribe('MyOrders');
                template.subsMyTrades = template.subscribe('MyTrades', Session.get('TradeFilterFrom'), Session.get('TradeFilterTo'));
            }
            template.subsPriceAverage = template.subscribe('PriceAverage', currentInstrumentSymbol);
            template.subsPriceLatest = template.subscribe('PriceLatest', currentInstrumentSymbol);
        }
    });
  
    Session.set('MyOpenOrdersPage', 0);
    Session.set('MyOrdersHistoryPage', 0);
    Session.set('MyTradesHistoryPage', 0);
});

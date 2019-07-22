import {
    updatePrice24, updateLatestPrice,
    updateTicker, updateAveragePrice, holdBalance,
    reverseBalance, getCurrentPriority,
} from '/imports/tools';
import { order, trade, myJobs } from '/imports/collections';
import { Job } from 'meteor/vsivsi:job-collection';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';

trade.after.insert(function (userId, doc) {
    if (doc.TradeState == 'Closed' && doc.Initial) {
        const currentDate = new Date();
  
        updateLatestPrice(currentDate, doc);
    
        // Add job to matching engine collection
        new Job(myJobs, 'Algo', { currentDate, trade: doc }).priority(getCurrentPriority()).save();
        // console.log('algo order ' + doc._id);
    
        updateTicker(currentDate, doc);
    
        updateAveragePrice(currentDate, doc);
  
        updatePrice24(currentDate, doc);
    }
});

trade.after.update(function(userId, doc, fieldNames, modifier) {
    // After deferred trade
    if (_.indexOf(['Closed'], modifier.$set.TradeState) != -1) {
        const currentDate = new Date();
  
        updateLatestPrice(currentDate, doc);
    
        // Add job to matching engine collection
        new Job(myJobs, 'Algo', { currentDate, trade: doc }).priority(getCurrentPriority()).save();
        // console.log('algo order ' + doc._id);
    
        updateTicker(currentDate, doc);
    
        updateAveragePrice(currentDate, doc);
  
        updatePrice24(currentDate, doc);
    }
}, { fetchPrevious: false });

order.before.insert(function(userId, doc) {
    /** Notes for "Hold" balance.
     *  We can hold only for Limit type because any Algo type will result in Limit or Market.
     *  For the Market type, we can estimate balance only in the process of executing.
    * */
  
    if (doc.OrderType == 'Limit') {
        const _product = String(doc.InstrumentSymbol).split('_');

        let productSymbol;
        let amount;
        if (doc.Side == 'Buy') {
            [, productSymbol] = _product;
            amount = doc.LimitPrice.times(doc.Quantity);
        } else {
            [productSymbol] = _product;
            amount = doc.Quantity;
        }

        try {
            holdBalance(doc.UserId, productSymbol, amount, doc._id, 'Order');
        } catch (e) {
            throw new Meteor.Error(e.message);
        }
    }
});
    
order.after.insert(function(userId, doc) {
    // Add job to matching engine collection
    new Job(myJobs, 'Fill', { OrderId: doc._id }).priority(getCurrentPriority()).save();
});

order.after.update(function(userId, doc, fieldNames, modifier) {
    if (_.indexOf(['Canceled', 'Expired'], modifier.$set.OrderState) != -1 && _.indexOf(['Limit', 'StopLimit', 'TrailingStopLimit'], doc.OrderType) != -1) {
        const _product = String(doc.InstrumentSymbol).split('_');
        let productSymbol;
        let amount;
        if (doc.Side == 'Buy') {
            [, productSymbol] = _product;
            amount = doc.LimitPrice.times(doc.Quantity);
        } else {
            [productSymbol] = _product;
            amount = doc.Quantity;
        }
        // Reverse balance
        reverseBalance(doc.UserId, productSymbol, amount, doc._id, 'Order');
    }
}, { fetchPrevious: false });

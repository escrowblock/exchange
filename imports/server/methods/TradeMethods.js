import { Decimal } from 'meteor/mongo-decimal';
import { _ } from 'meteor/underscore';
import { order } from '/imports/collections';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EJSON } from 'meteor/ejson';

Meteor.methods({
    addOrder (_order) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to place this order');
        }
        const newOrder = Object.assign({}, _order);
        if (newOrder.Quantity) {
            newOrder.Quantity = Decimal(newOrder.Quantity);
        }
        if (newOrder.LimitPrice) {
            newOrder.LimitPrice = Decimal(newOrder.LimitPrice);
        }
        if (newOrder.StopPrice) {
            newOrder.StopPrice = Decimal(newOrder.StopPrice);
        }
        if (newOrder.TrailingAmount) {
            newOrder.TrailingAmount = Decimal(newOrder.TrailingAmount);
        }
        if (newOrder.LimitOffset) {
            newOrder.LimitOffset = Decimal(newOrder.LimitOffset);
        }
    
        if (newOrder.Quantity.eq('0')) {
            throw new Meteor.Error(404, 'Quantity can not be equal 0');
        }
        check(newOrder, Object);
    
        // Initial states for all new orders
        newOrder.UserId = Meteor.userId();
        newOrder.OrderState = 'Working';
        newOrder.QuantityExecuted = Decimal('0');
        newOrder.ChangeReason = 'NewInputAccepted';
        newOrder.PreviousOrderRevision = 0;
        newOrder.RejectReason = '';
        newOrder.InsideAsk = Decimal('0');
        newOrder.InsideAskSize = Decimal('0');
        newOrder.InsideBid = Decimal('0');
        newOrder.InsideBidSize = Decimal('0');
        newOrder.LastTradePrice = Decimal('0');
        newOrder.IsLockedIn = false;
        newOrder.OrigQuantity = Decimal(newOrder.Quantity);

        switch (newOrder.OrderType) {
        case 'Market':
            newOrder.Price = Decimal('0'); // Set up market price
            break;
        case 'Limit':
            newOrder.Price = newOrder.LimitPrice;
            break;
        case 'StopMarket':
            newOrder.Price = Decimal('0'); // Set up market price
            break;
        case 'StopLimit':
            newOrder.Price = newOrder.LimitPrice;
            break;
        case 'TrailingStopMarket':
            newOrder.Price = Decimal('0'); // Set up market price
            break;
        case 'TrailingLimitMarket':
            newOrder.Price = newOrder.LimitPrice;
            break;
        case 'BlockTrade':
            newOrder.Price = Decimal('0'); // Set up market price
            break;
        default:
            break;
        }

        /*
        Required from the form: OrderType, Side
        Optional from the form: Price, PegPriceType, LimitPrice, StopPrice, TrailingAmount, LimitOffset
        */
    
        // @DEBUG
        if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
            console.debug(EJSON.stringify(newOrder));
        }
        //

        order.insert(newOrder);
    },
    cancelOrder (OrderID) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        check(OrderID, String);

        // @DEBUG
        if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
            console.debug(`Cancel ${OrderID}`);
        }
        //

        order.update({ _id: OrderID, UserId: Meteor.userId(), OrderState: { $in: ['Working'] } }, { $set: { OrderState: 'Canceled' } });
    },
    cancelOrderSell () {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        order.update({ Side: 'Sell', UserId: Meteor.userId(), OrderState: { $in: ['Working'] } }, { $set: { OrderState: 'Canceled' } }, { multi: 1 });
    },
    cancelOrderBuy () {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        order.update({ Side: 'Buy', UserId: Meteor.userId(), OrderState: { $in: ['Working'] } }, { $set: { OrderState: 'Canceled' } }, { multi: 1 });
    },
    cancelOrderAll () {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        order.update({ UserId: Meteor.userId(), OrderState: { $in: ['Working'] } }, { $set: { OrderState: 'Canceled' } }, { multi: 1 });
    },
});

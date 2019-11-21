import { Decimal } from 'meteor/mongo-decimal';
import { _ } from 'meteor/underscore';
import {
    order, product, schemas,
} from '/imports/collections';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EJSON } from 'meteor/ejson';

Meteor.methods({
    addOrder (_order) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to place this order');
        }

        const _product = String(_order.InstrumentSymbol).split('_');

        product.find({ ProductSymbol: { $in: _product } }, { fields: { ProductType: 1 } }).map(function(_product) {
            if (_product.ProductType == 'NationalCurrency') {
                if (_.isUndefined(Meteor.users.findOne({ _id: Meteor.userId() }).services.ethereum.encryptionpublickey)) {
                    throw new Meteor.Error(404, 'You must create encryption public key because this order type demands deferred transaction');
                } else {
                    return null;
                }
            }
            return null;
        });
        
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
    
        // Initial states for all new orders
        newOrder.UserId = Meteor.userId();
        newOrder.OrderState = 'Working';
        newOrder.QuantityExecuted = Decimal('0');
        newOrder.ChangeReason = 'NewInputAccepted';
        newOrder.PreviousOrderRevision = '';
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
        check(newOrder, schemas.order);
        
        const result = new Promise((resolve) => {
            order.insert(newOrder, function(error) {
                if (!error) {
                    resolve(true);
                } else {
                    resolve(new Meteor.Error(403, error.error));
                }
            });
        }).await();
        
        if (result !== true) {
            throw result;
        }
        return result;
    },
    cancelOrder (OrderId) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        check(OrderId, String);

        // @DEBUG
        if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
            console.debug(`Cancel ${OrderId}`);
        }
        //

        order.update({ _id: OrderId, UserId: Meteor.userId(), OrderState: { $in: ['Working'] } }, { $set: { OrderState: 'Canceled' } });
    },
    cancelOrderSell () {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        const ids = order.find({ Side: 'Sell', UserId: Meteor.userId(), OrderState: { $in: ['Working'] } }, { fields: { _id: 1 } }).map(function (obj) {
            return obj._id;
        });
        order.update({ _id: { $in: ids } }, { $set: { OrderState: 'Canceled' } }, { multi: 1 });
    },
    cancelOrderBuy () {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        const ids = order.find({ Side: 'Buy', UserId: Meteor.userId(), OrderState: { $in: ['Working'] } }, { fields: { _id: 1 } }).map(function (obj) {
            return obj._id;
        });
        order.update({ _id: { $in: ids } }, { $set: { OrderState: 'Canceled' } }, { multi: 1 });
    },
    cancelOrderAll () {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        const ids = order.find({ UserId: Meteor.userId(), OrderState: { $in: ['Working'] } }).map(function (obj) {
            return obj._id;
        });
        order.update({ _id: { $in: ids } }, { $set: { OrderState: 'Canceled' } }, { multi: 1 });
    },
});

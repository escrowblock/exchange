import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { generateFakeDataInstruments } from '/imports/fakeData';
import { closeTalkConfirmTrade } from '/imports/tools';
import { _ } from 'meteor/underscore';
import '/imports/server/dbhooks';
import '/imports/server/jobs';
import '/imports/server/hooks.js';
import { Decimal } from 'meteor/mongo-decimal';
import {
    order, balance, transaction, trade,
} from '/imports/collections';
import { Roles } from 'meteor/alanning:roles';
import { EJSON } from 'meteor/ejson';
import { Accounts } from 'meteor/accounts-base';

global.describe('Balance crypto to fiat', function () {
    this.timeout(10000);
    
    let userTaker; let
        userMaker;
    
    const orderInstance = {
        UserId: null,
        LimitPrice: Decimal('1001'),
        Quantity: Decimal('3'),
        TimeInForce: 'GTC',
        Side: 'Buy',
        OrderType: 'Limit',
        InstrumentSymbol: 'ESCB_USD',
        OrderState: 'Working',
        QuantityExecuted: Decimal('0'),
        ChangeReason: 'NewInputAccepted',
        PreviousOrderRevision: 0,
        RejectReason: '',
        InsideAsk: Decimal('0'),
        InsideAskSize: Decimal('0'),
        InsideBid: Decimal('0'),
        InsideBidSize: Decimal('0'),
        LastTradePrice: Decimal('0'),
        IsLockedIn: false,
        OrigQuantity: Decimal('3'),
        Price: Decimal('1001'),
    };
    global.beforeEach(function(done) {
        // , 'MatchingEngine.jobs']
        resetDatabase({ excludedCollections: ['roles'] }, function() {
            if (Meteor.settings.private.user_admin) {
                // Get settings from file of environment variables
                const user = Meteor.settings.private.user_admin;
                const id = Accounts.createUser({
                    wallet: user.wallet,
                    sign: user.sign,
                    email: user.email,
                    password: user.password,
                    profile: { name: user.name },
                });
                
                Roles.addUsersToRoles(id, user.roles, Roles.GLOBAL_GROUP);
            }
            generateFakeDataInstruments();
            // create an account with ethereum
            userTaker = Accounts.updateOrCreateUserFromExternalService('ethereum',
                {
                    id: '0x7abCaC5b70eBB22Aa05c7412058752C2BDB48865',
                    signature: '0x9127cd6beb3dcf6789842d2a820fd588aca8d8db4b19bf08d6fcc06efa17d99b5d24e3ca063d766295fbcb7062b4d5ca03c8dd6fb99e787636f43bf96d5b66251b',
                    publickey: 'c9b45b3481bdc48d8ddb09f5f47f513c38993ad2731b60efa2d8f89f802d6e37134e68608041eebda9fdad8be96cd03183201ac0eebaacb20865aef5a8a2b9bd',
                    encryptionpublickey: 'nFxp+ZRkfG3FRJOAp1TM46REHqXHBgyloazLNe+J+XE=',
                },
                {});
            
            Meteor.users.update({ _id: userTaker.userId }, { $set: { 'profile.language': 'en' } });
            
            // Here is balance in USD
            
            userMaker = Accounts.updateOrCreateUserFromExternalService('ethereum',
                {
                    id: '0xf593ca6A1D5013298F7dE87AF4386A807C02F7e8',
                    signature: '0x4d6d5047b1be60f4d158be8c6e2e5022ad3ea02b7c6f083338c53e86109a11c1335d58480b66707270c13fdef7c0479a44ba2fe224f5c078574307b01229ee361b',
                    publickey: 'dd036f14b0198dae36381242e1b47d249909446699d79bf1a478e7efe274c8caa54584ff908beb900e317b7ac535941815fd605816c33a8bbcca7f027058508b',
                    encryptionpublickey: 'fLCuEBf7FMygt2/lGHFyk4+/vEhjoE4ouZOsQZt+OXQ=',
                },
                {});
            
            Meteor.users.update({ _id: userMaker.userId }, { $set: { 'profile.language': 'en' } });

            balance.insert({
                UserId: userMaker.userId, ProductSymbol: 'ESCB', Balance: Decimal('10'), InTrade: Decimal('0'),
            });
            
            done();
        });
    });
    
    /**
     * Order type is limit
    * */
    
    // not enough balance
    global.it('test not enough balance for an order placing', function (done) {
        this.timeout(10000);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('10');
        orderBuy.Quantity = Decimal('1.000000000000000001');
        orderBuy.OrigQuantity = Decimal('1.000000000000000001');
        orderBuy.Side = 'Buy';
        
        let insertBuy_fail = false;
        const buyId = order.insert(orderBuy);
        
        if (!buyId) {
            insertBuy_fail = true;
        }
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('10');
        orderSell.Quantity = Decimal('10.000000000000000001');
        orderSell.OrigQuantity = Decimal('10.000000000000000001');
        orderSell.Side = 'Sell';
        
        let insertSell_fail = false;
        const sellId = order.insert(orderSell);
        
        if (!sellId) {
            insertSell_fail = true;
        }
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 0);
                
                chai.assert.equal(insertBuy_fail, false, "We don't know USD Balance"); // it is deffered - we can't check balance
                chai.assert.equal(insertSell_fail, true, 'Not enough crypto Balance');
                
                chai.assert.equal(order.find().count(), 1); // USD order

                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).Balance.toString(), '10', 'userMaker balance is 10');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).InTrade.toString(), '0', 'userMaker inTrade is 0');
                
                const txTaker = transaction.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' });
                
                chai.assert.equal(_.isUndefined(txTaker), true, 'userMaker transaction is not created'); // not enough balance
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
    
    // hold balance
    global.it('test hold balance after added order for deferred product', function (done) {
        this.timeout(10000);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('0.001');
        orderBuy.Quantity = Decimal('3.145');
        orderBuy.OrigQuantity = Decimal('3.145');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
            
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('0.002');
        orderSell.Quantity = Decimal('3.145');
        orderSell.OrigQuantity = Decimal('3.145');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);
                        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 0);
                
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).Balance.toString(), '6.855', 'userMaker balance is 6.855');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).InTrade.toString(), '3.145', 'userMaker inTrade is 3.145');
                
                const txTaker = transaction.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' });
                
                chai.assert.equal(txTaker.Credit.toString(), '3.145', 'userMaker Credit transaction is 3.145');
                chai.assert.equal(txTaker.Debit.toString(), '0', 'userMaker Debit transaction is 0');
                chai.assert.equal(txTaker.TransactionType, 'Hold', 'userMaker Type transaction is Hold');
                chai.assert.equal(txTaker.Balance.toString(), '6.855', 'userMaker Balance is 6.855');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
    
    // reverse balance
    global.it('test reverse balance after added order for deferred product', function (done) {
        this.timeout(10000);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('0.001');
        orderBuy.Quantity = Decimal('3.145');
        orderBuy.OrigQuantity = Decimal('3.145');
        orderBuy.Side = 'Buy';

        const buyId = order.insert(orderBuy);
                        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('0.002');
        orderSell.Quantity = Decimal('3.145');
        orderSell.OrigQuantity = Decimal('3.145');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);

        // cancel orders
        order.update({ _id: buyId }, { $set: { OrderState: 'Canceled' } });
        order.update({ _id: sellId }, { $set: { OrderState: 'Canceled' } });
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 0);
                
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).count(), 2);
                
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).Balance.toString(), '10', 'userMaker balance is 10');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).InTrade.toString(), '0', 'userMaker inTrade is 0');

                const txTaker = transaction.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }, { sort: { TimeStamp: -1 } });
                
                chai.assert.equal(txTaker.Credit.toString(), '0', 'userMaker Credit transaction is 0');
                chai.assert.equal(txTaker.Debit.toString(), '3.145', 'userMaker Debit transaction is 3.145');
                chai.assert.equal(txTaker.TransactionType, 'Reverse', 'userMaker Type transaction is Reverse');
                chai.assert.equal(txTaker.Balance.toString(), '10', 'userMaker Balance transaction is 10');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });

    // trade balance before close
    global.it('test trade balance after trade 1 to 1 limit orders for deferred product', function (done) {
        this.timeout(10000);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('0.031112');
        orderBuy.Quantity = Decimal('1.333');
        orderBuy.OrigQuantity = Decimal('1.333');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
                        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('0.031112');
        orderSell.Quantity = Decimal('1.333');
        orderSell.OrigQuantity = Decimal('1.333');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);
                        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] }, TradeState: 'Deferred' }).count(), 2);
                
                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0', 'sell RemainingQuantity is 0');
                
                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0', 'sell Quantity is 0');
                
                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '1.333', 'buy QuantityExecuted is 1.333');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '1.333', 'sell QuantityExecuted is 1.333');
                
                chai.assert.equal(_.isUndefined(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'ESCB' })), true, 'userTaker ESCB balance is not created');
                
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).count(), 1); // hold
                
                const txMaker = transaction.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }, {
                    sort: { TimeStamp: -1 },
                    fields: {
                        Credit: 1, Debit: 1, TransactionType: 1, Balance: 1, ProductSymbol: 1,
                    },
                });
                
                chai.assert.equal(txMaker.TransactionType, 'Hold', 'userMaker Type transaction is Hold');
                chai.assert.equal(txMaker.Debit.toString(), '0', 'userMaker Debit transaction is 0');
                chai.assert.equal(txMaker.Credit.toString(), '1.333', 'userMaker Credit transaction is 1.333');
                chai.assert.equal(txMaker.Balance.toString(), '8.667', 'userMaker Balance transaction is 8.667');
                chai.assert.equal(txMaker.ProductSymbol, 'ESCB', 'userMaker ProductSymbol transaction is ESCB');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });

    // trade balance after close
    global.it('test trade balance after closed trade 1 to 1 limit orders for deferred product', function (done) {
        this.timeout(10000);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('0.031112');
        orderBuy.Quantity = Decimal('1.333');
        orderBuy.OrigQuantity = Decimal('1.333');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
                        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('0.031112');
        orderSell.Quantity = Decimal('1.333');
        orderSell.OrigQuantity = Decimal('1.333');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);
                        
        setTimeout(Meteor.bindEnvironment(() => {
            const _ExecutionId = trade.findOne({ OrderId: buyId }).ExecutionId;
            closeTalkConfirmTrade(_ExecutionId);
        }), 2000);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] }, TradeState: 'Closed' }).count(), 2);
                
                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0', 'sell RemainingQuantity is 0');
                
                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0', 'sell Quantity is 0');
                
                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '1.333', 'buy QuantityExecuted is 1.333');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '1.333', 'sell QuantityExecuted is 1.333');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'ESCB' }).Balance.toString(), '1.331667', 'userTaker ESCB balance is 1.331667');
                
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).count(), 1); // hold
                
                const txMaker = transaction.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }, {
                    sort: { TimeStamp: -1 },
                    fields: {
                        Credit: 1, Debit: 1, TransactionType: 1, Balance: 1, ProductSymbol: 1,
                    },
                });
                
                chai.assert.equal(txMaker.TransactionType, 'Hold', 'userMaker Type transaction is Hold');
                chai.assert.equal(txMaker.Debit.toString(), '0', 'userMaker Debit transaction is 0');
                chai.assert.equal(txMaker.Credit.toString(), '1.333', 'userMaker Credit transaction is 1.333');
                chai.assert.equal(txMaker.Balance.toString(), '8.667', 'userMaker Balance transaction is 8.667');
                chai.assert.equal(txMaker.ProductSymbol, 'ESCB', 'userMaker ProductSymbol transaction is ESCB');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
});

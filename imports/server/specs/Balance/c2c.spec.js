import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { generateFakeDataInstruments } from '/imports/fakeData';
import '/imports/server/dbhooks.js';
import '/imports/server/jobs.js';
import { _ } from 'meteor/underscore';
import { Decimal } from 'meteor/mongo-decimal';
import {
    order, balance, transaction, trade,
} from '/imports/collections';
import { Roles } from 'meteor/alanning:roles';
import { EJSON } from 'meteor/ejson';
import { Accounts } from 'meteor/accounts-base';

global.describe('Balance crypto to crypto', function () {
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
        InstrumentSymbol: 'ETH_BTC',
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
                },
                {});
            
            balance.insert({
                UserId: userTaker.userId, ProductSymbol: 'BTC', Balance: Decimal('10'), InTrade: Decimal('0'),
            });
            
            userMaker = Accounts.updateOrCreateUserFromExternalService('ethereum',
                {
                    id: '0xf593ca6A1D5013298F7dE87AF4386A807C02F7e8',
                    signature: '0x4d6d5047b1be60f4d158be8c6e2e5022ad3ea02b7c6f083338c53e86109a11c1335d58480b66707270c13fdef7c0479a44ba2fe224f5c078574307b01229ee361b',
                    publickey: 'dd036f14b0198dae36381242e1b47d249909446699d79bf1a478e7efe274c8caa54584ff908beb900e317b7ac535941815fd605816c33a8bbcca7f027058508b',
                },
                {});
            
            balance.insert({
                UserId: userMaker.userId, ProductSymbol: 'ETH', Balance: Decimal('10'), InTrade: Decimal('0'),
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
        let buyId = null;
        try {
            buyId = order.insert(orderBuy);
        } catch (e) {
            insertBuy_fail = true;
        }
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('10');
        orderSell.Quantity = Decimal('1.000000000000000001');
        orderSell.OrigQuantity = Decimal('1.000000000000000001');
        orderSell.Side = 'Sell';
        
        let insertSell_fail = false;
        let sellId = null;
        try {
            sellId = order.insert(orderSell);
        } catch (e) {
            insertSell_fail = true;
        }
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 0);
                
                chai.assert.equal(insertBuy_fail, true);
                chai.assert.equal(insertSell_fail, false);
                
                chai.assert.equal(order.find().count(), 1);

                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).Balance.toString(), '10', 'userTaker balance is 10'); // not enough balance
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).Balance.toString(), '8.999999999999999999', 'userMaker balance is 8.999999999999999999');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).InTrade.toString(), '0', 'userTaker inTrade is 0'); // not enough balance
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).InTrade.toString(), '1.000000000000000001', 'userMaker inTrade is 1');
                
                const txTaker = transaction.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' });
                const txMaker = transaction.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' });
                
                chai.assert.equal(_.isUndefined(txTaker), true, 'userTaker transaction is not created');
                chai.assert.equal(_.isUndefined(txMaker), false, 'userMaker transaction is not created'); // hold
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
    
    // hold balance
    global.it('test hold balance after added order', function (done) {
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
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).Balance.toString(), '9.996855', 'userTaker balance is 9.996855');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).Balance.toString(), '6.855', 'userMaker balance is 6.855');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).InTrade.toString(), '0.003145', 'userTaker inTrade is 0.003145');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).InTrade.toString(), '3.145', 'userMaker inTrade is 3.145');
                
                const txTaker = transaction.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' });
                const txMaker = transaction.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' });
                
                chai.assert.equal(txTaker.Credit.toString(), '0.003145', 'userTaker Credit transaction is 0.003145');
                chai.assert.equal(txMaker.Credit.toString(), '3.145', 'userMaker Credit transaction is 3.145');
                
                chai.assert.equal(txTaker.Debit.toString(), '0', 'userTaker Debit transaction is 0');
                chai.assert.equal(txMaker.Debit.toString(), '0', 'userMaker Debit transaction is 0');
                
                chai.assert.equal(txTaker.TransactionType, 'Hold', 'userTaker Type transaction is Hold');
                chai.assert.equal(txMaker.TransactionType, 'Hold', 'userMaker Type transaction is Hold');
                
                chai.assert.equal(txTaker.Balance.toString(), '9.996855', 'userTaker Balance is 9.996855');
                chai.assert.equal(txMaker.Balance.toString(), '6.855', 'userMaker Balance is 6.855');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
    
    // reverse balance
    global.it('test reverse balance after added order', function (done) {
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
                
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).count(), 2);
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).count(), 2);
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).Balance.toString(), '10', 'userTaker balance is 10');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).Balance.toString(), '10', 'userMaker balance is 10');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).InTrade.toString(), '0', 'userTaker inTrade is 0');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).InTrade.toString(), '0', 'userMaker inTrade is 0');
                
                const txTaker = transaction.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }, { sort: { TimeStamp: -1 } });
                const txMaker = transaction.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }, { sort: { TimeStamp: -1 } });
                
                chai.assert.equal(txTaker.Credit.toString(), '0', 'userTaker Credit transaction is 0');
                chai.assert.equal(txMaker.Credit.toString(), '0', 'userMaker Credit transaction is 0');
                
                chai.assert.equal(txTaker.Debit.toString(), '0.003145', 'userTaker Debit transaction is 0.003145');
                chai.assert.equal(txMaker.Debit.toString(), '3.145', 'userMaker Debit transaction is 3.145');
                
                chai.assert.equal(txTaker.TransactionType, 'Reverse', 'userTaker Type transaction is Reverse');
                chai.assert.equal(txMaker.TransactionType, 'Reverse', 'userMaker Type transaction is Reverse');
                
                chai.assert.equal(txTaker.Balance.toString(), '10', 'userTaker Balance transaction is 10');
                chai.assert.equal(txMaker.Balance.toString(), '10', 'userMaker Balance transaction is 10');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });

    // trade balance
    global.it('test trade balance after trade 1 to 1 limit orders', function (done) {
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
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 2);
                
                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0', 'sell RemainingQuantity is 0');
                
                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0', 'sell Quantity is 0');
                
                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '1.333', 'buy QuantityExecuted is 1.333');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '1.333', 'sell QuantityExecuted is 1.333');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).Balance.toString(), '9.958527704', 'userTaker BTC balance is 9.958527704');
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'ETH' }).Balance.toString(), '1.333', 'userTaker ETH balance is 1.333');
                
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).Balance.toString(), '8.667', 'userMaker ETH balance is 8.667');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'BTC' }).Balance.toString(), '0.041472296', 'userMaker ETH balance is 0.041472296');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).InTrade.toString(), '0', 'userTaker inTrade is 0');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).InTrade.toString(), '0', 'userMaker inTrade is 0');
                
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).count(), 1); // hold
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, ProductSymbol: 'ETH' }).count(), 1); // trade
                
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).count(), 1); // hold
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, ProductSymbol: 'BTC' }).count(), 1); // trade
                
                const txTaker = transaction.findOne({ UserId: userTaker.userId, ProductSymbol: 'ETH' }, {
                    sort: { TimeStamp: -1 },
                    fields: {
                        Credit: 1, Debit: 1, TransactionType: 1, Balance: 1, ProductSymbol: 1,
                    },
                });
                const txMaker = transaction.findOne({ UserId: userMaker.userId, ProductSymbol: 'BTC' }, {
                    sort: { TimeStamp: -1 },
                    fields: {
                        Credit: 1, Debit: 1, TransactionType: 1, Balance: 1, ProductSymbol: 1,
                    },
                });
                
                chai.assert.equal(txTaker.TransactionType, 'Trade', 'userTaker Type transaction is Trade');
                chai.assert.equal(txMaker.TransactionType, 'Trade', 'userMaker Type transaction is Trade');
                
                chai.assert.equal(txTaker.Debit.toString(), '1.333', 'userTaker Debit transaction is 1.333');
                chai.assert.equal(txMaker.Debit.toString(), '0.041472296', 'userMaker Debit transaction is 0.041472296');
                
                chai.assert.equal(txTaker.Credit.toString(), '0', 'userTaker Credit transaction is 0');
                chai.assert.equal(txMaker.Credit.toString(), '0', 'userMaker Credit transaction is 0');
                
                chai.assert.equal(txTaker.Balance.toString(), '1.333', 'userTaker Balance transaction is 1.333');
                chai.assert.equal(txTaker.ProductSymbol, 'ETH', 'userTaker ProductSymbol transaction is ETH');
                
                chai.assert.equal(txMaker.Balance.toString(), '0.041472296', 'userMaker Balance transaction is 0.041472296');
                chai.assert.equal(txMaker.ProductSymbol, 'BTC', 'userMaker ProductSymbol transaction is BTC');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });

    global.it('test sell stop limit order by 1001 with stop price 1101 with deal by 1100 with not enough balance', function (done) {
        this.timeout(10000);
        
        const orderSellSL = EJSON.clone(orderInstance);
        orderSellSL.UserId = userTaker.userId;
        orderSellSL.LimitPrice = Decimal('1001');
        orderSellSL.StopPrice = Decimal('0.031112');
        orderSellSL.Quantity = Decimal('1.333');
        orderSellSL.OrigQuantity = Decimal('1.333');
        orderSellSL.Side = 'Sell';
        orderSellSL.OrderType = 'StopLimit';
        
        const sellIdSL = order.insert(orderSellSL);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('0.031111');
        orderBuy.Quantity = Decimal('1.333');
        orderBuy.OrigQuantity = Decimal('1.333');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('0.031111');
        orderSell.Quantity = Decimal('1.333');
        orderSell.OrigQuantity = Decimal('1.333');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 2);

                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0', 'sell RemainingQuantity is 0');

                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0', 'sell Quantity is 0');

                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '1.333', 'buy QuantityExecuted is 1.333');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '1.333', 'sell QuantityExecuted is 1.333');

                chai.assert.equal(order.findOne({ _id: sellIdSL }).OrderState, 'Rejected', 'BuySL Algo state is Rejected');
                chai.assert.equal(_.isUndefined(order.findOne({ PreviousOrderRevision: sellIdSL })), true, 'New limit order is not created, not enough balance');

                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
});

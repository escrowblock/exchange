import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { generateFakeDataInstruments } from '/imports/fakeData';
import '/imports/server/dbhooks.js';
import '/imports/server/jobs.js';
import { Decimal } from 'meteor/mongo-decimal';
import {
    fee, order, balance, transaction, trade,
} from '/imports/collections';
import { Roles } from 'meteor/alanning:roles';
import { EJSON } from 'meteor/ejson';
import { Accounts } from 'meteor/accounts-base';

global.describe('Fee crypto to crypto', function () {
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
                    encryptionpublickey: 'nFxp+ZRkfG3FRJOAp1TM46REHqXHBgyloazLNe+J+XE=',
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
                    encryptionpublickey: 'fLCuEBf7FMygt2/lGHFyk4+/vEhjoE4ouZOsQZt+OXQ=',
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

    // trade balance
    global.it('test fee after trade 1 to 1 limit orders', function (done) {
        this.timeout(10000);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('0.5');
        orderBuy.Quantity = Decimal('2');
        orderBuy.OrigQuantity = Decimal('2');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('0.5');
        orderSell.Quantity = Decimal('2');
        orderSell.OrigQuantity = Decimal('2');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 2);
                
                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0', 'sell RemainingQuantity is 0');
                
                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0', 'sell Quantity is 0');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).Balance.toString(), '9', 'userTaker BTC balance is 8');
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'ETH' }).Balance.toString(), '1.998', 'userTaker ETH balance is 1.998');
                
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).Balance.toString(), '8', 'userMaker ETH balance is 8');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'BTC' }).Balance.toString(), '0.999', 'userMaker BTC balance is 0.999');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).InTrade.toString(), '0', 'userTaker inTrade is 0');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).InTrade.toString(), '0', 'userMaker inTrade is 0');
                
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, TransactionType: 'Hold', ProductSymbol: 'BTC' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, TransactionType: 'Trade', ProductSymbol: 'ETH' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, TransactionType: 'Fee', ProductSymbol: 'ETH' }).count(), 1);
                
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, TransactionType: 'Hold', ProductSymbol: 'ETH' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, TransactionType: 'Trade', ProductSymbol: 'BTC' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, TransactionType: 'Fee', ProductSymbol: 'BTC' }).count(), 1);
                
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
                
                chai.assert.equal(txTaker.TransactionType, 'Fee', 'userTaker Type transaction is Fee');
                chai.assert.equal(txMaker.TransactionType, 'Fee', 'userMaker Type transaction is Fee');
                
                chai.assert.equal(txTaker.Debit.toString(), '0', 'userTaker Debit transaction is 0');
                chai.assert.equal(txMaker.Debit.toString(), '0', 'userMaker Debit transaction is 0');
                
                chai.assert.equal(txTaker.Credit.toString(), '0.002', 'userTaker Credit transaction is 0.002');
                chai.assert.equal(txMaker.Credit.toString(), '0.001', 'userMaker Credit transaction is 0.001');
                
                chai.assert.equal(txTaker.Balance.toString(), '1.998', 'userTaker Balance transaction is 1.998');
                chai.assert.equal(txTaker.ProductSymbol, 'ETH', 'userTaker ProductSymbol transaction is ETH');
                
                chai.assert.equal(txMaker.Balance.toString(), '0.999', 'userMaker Balance transaction is 0.999');
                chai.assert.equal(txMaker.ProductSymbol, 'BTC', 'userMaker ProductSymbol transaction is BTC');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
    
    global.it('test personal fee after trade 1 to 1 limit orders', function (done) {
        this.timeout(10000);
        
        fee.upsert({ UserId: userTaker.userId }, { $set: { FeeTaker: Decimal('0.0001'), FeeMaker: Decimal('0.0001') } }); // 10% discount
        fee.upsert({ UserId: userMaker.userId }, { $set: { FeeTaker: Decimal('0.0001'), FeeMaker: Decimal('0.0001') } }); // 10% discount
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('0.5');
        orderBuy.Quantity = Decimal('2');
        orderBuy.OrigQuantity = Decimal('2');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('0.5');
        orderSell.Quantity = Decimal('2');
        orderSell.OrigQuantity = Decimal('2');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 2);
                
                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0', 'sell RemainingQuantity is 0');
                
                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0', 'sell Quantity is 0');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).Balance.toString(), '9', 'userTaker BTC balance is 9');
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'ETH' }).Balance.toString(), '1.9998', 'userTaker ETH balance is 1.9998');
                
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).Balance.toString(), '8', 'userMaker ETH balance is 8');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'BTC' }).Balance.toString(), '0.9999', 'userMaker ETH balance is 0.9999');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).InTrade.toString(), '0', 'userTaker inTrade is 0');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).InTrade.toString(), '0', 'userMaker inTrade is 0');
                
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, TransactionType: 'Hold', ProductSymbol: 'BTC' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, TransactionType: 'Trade', ProductSymbol: 'ETH' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, TransactionType: 'Fee', ProductSymbol: 'ETH' }).count(), 1);
                
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, TransactionType: 'Hold', ProductSymbol: 'ETH' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, TransactionType: 'Trade', ProductSymbol: 'BTC' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, TransactionType: 'Fee', ProductSymbol: 'BTC' }).count(), 1);
                
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
                
                chai.assert.equal(txTaker.TransactionType, 'Fee', 'userTaker Type transaction is Fee');
                chai.assert.equal(txMaker.TransactionType, 'Fee', 'userMaker Type transaction is Fee');
                
                chai.assert.equal(txTaker.Debit.toString(), '0', 'userTaker Debit transaction is 0');
                chai.assert.equal(txMaker.Debit.toString(), '0', 'userMaker Debit transaction is 0');
                
                chai.assert.equal(txTaker.Credit.toString(), '0.0002', 'userTaker Credit transaction is 0.0002');
                chai.assert.equal(txMaker.Credit.toString(), '0.0001', 'userMaker Credit transaction is 0.0001');
                
                chai.assert.equal(txTaker.Balance.toString(), '1.9998', 'userTaker Balance transaction is 1.9998');
                chai.assert.equal(txTaker.ProductSymbol, 'ETH', 'userTaker ProductSymbol transaction is ETH');
                
                chai.assert.equal(txMaker.Balance.toString(), '0.9999', 'userMaker Balance transaction is 0.9999');
                chai.assert.equal(txMaker.ProductSymbol, 'BTC', 'userMaker ProductSymbol transaction is BTC');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
    
    global.it('test zero fee after trade 1 to 1 limit orders', function (done) {
        this.timeout(10000);
        
        fee.upsert({ UserId: userTaker.userId }, { $set: { FeeTaker: Decimal('0'), FeeMaker: Decimal('0') } }); // 100% discount
        fee.upsert({ UserId: userMaker.userId }, { $set: { FeeTaker: Decimal('0'), FeeMaker: Decimal('0') } }); // 100% discount
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('0.5');
        orderBuy.Quantity = Decimal('2');
        orderBuy.OrigQuantity = Decimal('2');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('0.5');
        orderSell.Quantity = Decimal('2');
        orderSell.OrigQuantity = Decimal('2');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 2);
                
                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0', 'sell RemainingQuantity is 0');
                
                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0', 'sell Quantity is 0');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).Balance.toString(), '9', 'userTaker BTC balance is 9');
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'ETH' }).Balance.toString(), '2', 'userTaker ETH balance is 2');
                
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).Balance.toString(), '8', 'userMaker ETH balance is 8');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'BTC' }).Balance.toString(), '1', 'userMaker ETH balance is 1');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'BTC' }).InTrade.toString(), '0', 'userTaker inTrade is 0');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ETH' }).InTrade.toString(), '0', 'userMaker inTrade is 0');
                
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, TransactionType: 'Hold', ProductSymbol: 'BTC' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, TransactionType: 'Trade', ProductSymbol: 'ETH' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userTaker.userId, TransactionType: 'Fee', ProductSymbol: 'ETH' }).count(), 0);
                
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, TransactionType: 'Hold', ProductSymbol: 'ETH' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, TransactionType: 'Trade', ProductSymbol: 'BTC' }).count(), 1);
                chai.assert.equal(transaction.find({ UserId: userMaker.userId, TransactionType: 'Fee', ProductSymbol: 'BTC' }).count(), 0);
                
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
                
                chai.assert.equal(txTaker.Debit.toString(), '2', 'userTaker Debit transaction is 2');
                chai.assert.equal(txMaker.Debit.toString(), '1', 'userMaker Debit transaction is 1');
                
                chai.assert.equal(txTaker.Credit.toString(), '0', 'userTaker Credit transaction is 0');
                chai.assert.equal(txMaker.Credit.toString(), '0', 'userMaker Credit transaction is 0');
                
                chai.assert.equal(txTaker.Balance.toString(), '2', 'userTaker Balance transaction is 2');
                chai.assert.equal(txTaker.ProductSymbol, 'ETH', 'userTaker ProductSymbol transaction is ETH');
                
                chai.assert.equal(txMaker.Balance.toString(), '1', 'userMaker Balance transaction is 1');
                chai.assert.equal(txMaker.ProductSymbol, 'BTC', 'userMaker ProductSymbol transaction is BTC');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
});

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
    order, balance, transaction, trade, talk,
} from '/imports/collections';
import { Roles } from 'meteor/alanning:roles';
import { EJSON } from 'meteor/ejson';
import { Accounts } from 'meteor/accounts-base';

global.describe('Deferred transaction after crypto to fiat order', function () {
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
    
    global.it('test that buyer crypto creates Talk', function (done) {
        this.timeout(10000);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('1');
        orderBuy.Quantity = Decimal('1.000000000000000001');
        orderBuy.OrigQuantity = Decimal('1.000000000000000001');
        orderBuy.Side = 'Buy';
        
        let insertBuy_fail = false;
        let buyId = null;
        
        buyId = order.insert(orderBuy);
        
        if (!buyId) {
            insertBuy_fail = true;
        }
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('1');
        orderSell.Quantity = Decimal('1.000000000000000001');
        orderSell.OrigQuantity = Decimal('1.000000000000000001');
        orderSell.Side = 'Sell';
        
        let insertSell_fail = false;
        let sellId = null;
        
        sellId = order.insert(orderSell);
        
        if (!sellId) {
            insertSell_fail = true;
        }
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(insertBuy_fail, false, "We don't know USD Balance"); // it is deffered - we can't check balance
                chai.assert.equal(insertSell_fail, false, 'Enough crypto Balance');
                
                chai.assert.equal(order.find().count(), 2);
                
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 2);

                chai.assert.equal(trade.findOne({ OrderId: buyId }).TradeState, 'Deferred');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).TradeState, 'Deferred');

                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).Balance.toString(), '8.999999999999999999', 'userMaker balance is 8.999999999999999999');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).InTrade.toString(), '1.000000000000000001', 'userMaker inTrade is 1.000000000000000001');
                
                const txTaker = transaction.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' });
                chai.assert.equal(_.isUndefined(txTaker), false, 'userMaker transaction is created');
                
                const talkInitialized = talk.findOne({ UserId: userMaker.userId });
                chai.assert.equal(_.isUndefined(talkInitialized), false, 'Talk is initialized from userMaker');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });

    global.it('test that seller fiat creates Talk', function (done) {
        this.timeout(10000);
        
        balance.insert({
            UserId: userTaker.userId, ProductSymbol: 'ESCB', Balance: Decimal('10'), InTrade: Decimal('0'),
        });
            
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('1');
        orderBuy.Quantity = Decimal('1.000000000000000001');
        orderBuy.OrigQuantity = Decimal('1.000000000000000001');
        orderBuy.Side = 'Sell';
        
        let insertSell_fail = false;
        let buyId = null;
        
        buyId = order.insert(orderBuy);
        
        if (!buyId) {
            insertSell_fail = true;
        }
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('1');
        orderSell.Quantity = Decimal('1.000000000000000001');
        orderSell.OrigQuantity = Decimal('1.000000000000000001');
        orderSell.Side = 'Buy';
        
        let insertBuy_fail = false;
        let sellId = null;
        
        sellId = order.insert(orderSell);
        
        if (!sellId) {
            insertBuy_fail = true;
        }
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(insertBuy_fail, false, "We don't know USD Balance"); // it is deffered - we can't check balance
                chai.assert.equal(insertSell_fail, false, 'Enough crypto Balance');
                
                chai.assert.equal(order.find().count(), 2);
                
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 2);

                chai.assert.equal(trade.findOne({ OrderId: buyId }).TradeState, 'Deferred');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).TradeState, 'Deferred');

                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'ESCB' }).Balance.toString(), '8.999999999999999999', 'userMaker balance is 8.999999999999999999');
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'ESCB' }).InTrade.toString(), '1.000000000000000001', 'userMaker inTrade is 1.000000000000000001');
                
                const txTaker = transaction.findOne({ UserId: userTaker.userId, ProductSymbol: 'ESCB' });
                chai.assert.equal(_.isUndefined(txTaker), false, 'userTaker transaction is created');
                
                chai.assert.equal(_.isUndefined(talk.findOne({ UserId: userTaker.userId })), false, 'Talk is initialized from userTaker');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
    
    global.it('test that deferred trades happen after Talk close event', function (done) {
        this.timeout(10000);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('1');
        orderBuy.Quantity = Decimal('1.000000000000000001');
        orderBuy.OrigQuantity = Decimal('1.000000000000000001');
        orderBuy.Side = 'Buy';
        
        let insertBuy_fail = false;
        let buyId = null;
        
        buyId = order.insert(orderBuy);
        
        if (!buyId) {
            insertBuy_fail = true;
        }
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('1');
        orderSell.Quantity = Decimal('1.000000000000000001');
        orderSell.OrigQuantity = Decimal('1.000000000000000001');
        orderSell.Side = 'Sell';
        
        let insertSell_fail = false;
        let sellId = null;

        sellId = order.insert(orderSell);
        
        if (!sellId) {
            insertSell_fail = true;
        }
        
        setTimeout(Meteor.bindEnvironment(() => {
            const _order = order.findOne({ _id: sellId }, { fields: { ExecutionId: 1 } });
            closeTalkConfirmTrade(_order.ExecutionId);
        }), 2000);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(insertBuy_fail, false, "We don't know USD Balance"); // it is deffered - we can't check balance
                chai.assert.equal(insertSell_fail, false, 'Enough crypto Balance');
                
                chai.assert.equal(order.find().count(), 2);
                
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 2);

                chai.assert.equal(trade.findOne({ OrderId: buyId }).TradeState, 'Closed');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).TradeState, 'Closed');

                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).Balance.toString(), '8.998999999999999999', 'userMaker balance is 8.998999999999999999');
                chai.assert.equal(balance.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' }).InTrade.toString(), '0', 'userMaker inTrade is 0');
                
                chai.assert.equal(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'ESCB' }).Balance.toString(), '0.999000000000000001', 'userTaker balance is 0.999000000000000001');
                chai.assert.equal(_.isUndefined(balance.findOne({ UserId: userTaker.userId, ProductSymbol: 'ESCB' }).InTrade), true, 'userTaker inTrade is undefined');
                
                const txTaker = transaction.findOne({ UserId: userMaker.userId, ProductSymbol: 'ESCB' });
                chai.assert.equal(_.isUndefined(txTaker), false, 'userMaker transaction is created');
                
                chai.assert.equal(_.isUndefined(talk.findOne({ UserId: userMaker.userId })), false, 'Talk is initialized from userMaker');
                
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
});

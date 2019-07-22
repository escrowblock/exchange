import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { generateFakeDataInstruments } from '/imports/fakeData';
import '/imports/server/dbhooks.js';
import '/imports/server/jobs.js';
import '/imports/server/hooks.js';
import { Decimal } from 'meteor/mongo-decimal';
import { order, balance, trade } from '/imports/collections';
import { Roles } from 'meteor/alanning:roles';
import { EJSON } from 'meteor/ejson';
import { Accounts } from 'meteor/accounts-base';

global.describe('ME TimeInForce', function () {
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
                UserId: userTaker.userId, ProductSymbol: 'BTC', Balance: Decimal('1000000'), InTrade: Decimal('0'),
            });
            
            userMaker = Accounts.updateOrCreateUserFromExternalService('ethereum',
                {
                    id: '0xf593ca6A1D5013298F7dE87AF4386A807C02F7e8',
                    signature: '0x4d6d5047b1be60f4d158be8c6e2e5022ad3ea02b7c6f083338c53e86109a11c1335d58480b66707270c13fdef7c0479a44ba2fe224f5c078574307b01229ee361b',
                    publickey: 'dd036f14b0198dae36381242e1b47d249909446699d79bf1a478e7efe274c8caa54584ff908beb900e317b7ac535941815fd605816c33a8bbcca7f027058508b',
                },
                {});
            
            balance.insert({
                UserId: userMaker.userId, ProductSymbol: 'ETH', Balance: Decimal('1000000'), InTrade: Decimal('0'),
            });
            
            done();
        });
    });
    
    /**
     * TimeInForce
    * */
    
    // IOC
    global.it('test IOC for buy 1000 and sell 1001, must be expired', function (done) {
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('1000');
        orderBuy.Quantity = Decimal('3.145');
        orderBuy.OrigQuantity = Decimal('3.145');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('1001');
        orderSell.Quantity = Decimal('4');
        orderSell.OrigQuantity = Decimal('4');
        orderSell.Side = 'Sell';
        orderSell.TimeInForce = 'IOC';
        
        const sellId = order.insert(orderSell);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 0);
                
                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '3.145', 'buy Quantity is 3.145');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '4', 'sell Quantity is 3.145');
                
                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '0', 'buy QuantityExecuted is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '0', 'sell QuantityExecuted is 0');
    
                chai.assert.equal(order.findOne({ _id: sellId }).OrderState, 'Expired', 'sell is Expired');
    
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
    
    global.it('test IOC limit orders by 1001 both, must be filled as possible', function (done) {
        this.timeout(10000);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('1001');
        orderBuy.Quantity = Decimal('3.145');
        orderBuy.OrigQuantity = Decimal('3.145');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('1001');
        orderSell.Quantity = Decimal('4');
        orderSell.OrigQuantity = Decimal('4');
        orderSell.Side = 'Sell';
        orderSell.TimeInForce = 'IOC';
        
        const sellId = order.insert(orderSell);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 2);
                
                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0.855', 'sell RemainingQuantity is 0.855');
                
                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0.855', 'sell Quantity is 0.855');
                
                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '3.145', 'buy QuantityExecuted is 3.145');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '3.145', 'sell QuantityExecuted is 3.145');
    
                chai.assert.equal(order.findOne({ _id: sellId }).OrderState, 'Expired', 'sell is Expired');
    
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
    
    // FOK
    global.it('test FOK for buy 1000 and sell 1001, must be expired', function (done) {
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('1000');
        orderBuy.Quantity = Decimal('3.145');
        orderBuy.OrigQuantity = Decimal('3.145');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('1001');
        orderSell.Quantity = Decimal('4');
        orderSell.OrigQuantity = Decimal('4');
        orderSell.Side = 'Sell';
        orderSell.TimeInForce = 'FOK';
        
        const sellId = order.insert(orderSell);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 0);
                
                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '3.145', 'buy Quantity is 3.145');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '4', 'sell Quantity is 3.145');
                
                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '0', 'buy QuantityExecuted is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '0', 'sell QuantityExecuted is 0');
    
                chai.assert.equal(order.findOne({ _id: sellId }).OrderState, 'Expired', 'sell is Expired');
    
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
    
    global.it('test FOK limit orders by 1001 both, must be expired because not fully filled', function (done) {
        this.timeout(10000);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('1001');
        orderBuy.Quantity = Decimal('3.145');
        orderBuy.OrigQuantity = Decimal('3.145');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('1001');
        orderSell.Quantity = Decimal('4');
        orderSell.OrigQuantity = Decimal('4');
        orderSell.Side = 'Sell';
        orderSell.TimeInForce = 'FOK';
        
        const sellId = order.insert(orderSell);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 0);
                
                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '3.145', 'buy Quantity is 3.145');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '4', 'sell Quantity is 4');
                
                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '0', 'buy QuantityExecuted is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '0', 'sell QuantityExecuted is 0');
    
                chai.assert.equal(order.findOne({ _id: sellId }).OrderState, 'Expired', 'sell is Expired');
    
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
});

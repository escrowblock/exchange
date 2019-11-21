import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { generateFakeDataInstruments } from '/imports/fakeData';
import '/imports/server/dbhooks.js';
import '/imports/server/jobs.js';
import '/imports/server/hooks.js';
import { Decimal } from 'meteor/mongo-decimal';
import { balance, order, trade } from '/imports/collections';
import { Roles } from 'meteor/alanning:roles';
import { EJSON } from 'meteor/ejson';
import { Accounts } from 'meteor/accounts-base';

global.describe('ME TrailingStopMarket', function () {
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
        StopPrice: Decimal('1001'),
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
                UserId: userTaker.userId, ProductSymbol: 'BTC', Balance: Decimal('1000000'), InTrade: Decimal('0'),
            });
            
            balance.insert({
                UserId: userTaker.userId, ProductSymbol: 'ETH', Balance: Decimal('1000000'), InTrade: Decimal('0'),
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
                UserId: userMaker.userId, ProductSymbol: 'BTC', Balance: Decimal('1000000'), InTrade: Decimal('0'),
            });
            
            balance.insert({
                UserId: userMaker.userId, ProductSymbol: 'ETH', Balance: Decimal('1000000'), InTrade: Decimal('0'),
            });
            
            done();
        });
    });
    
    /**
     * Order type is TrailingStopMarket
    * */
    
    // 1 to 1 simple stop trailing limit
    global.it('test StopPprice buy trailing stop market order by 1001 with stop price 900 with deal by 870 TrailingAmount 50 and PegPriceType Last', function (done) {
        this.timeout(10000);
        
        const orderBuySTL = EJSON.clone(orderInstance);
        orderBuySTL.UserId = userTaker.userId;
        orderBuySTL.StopPrice = Decimal('900'); // initial StopPrice
        orderBuySTL.Quantity = Decimal('3.145');
        orderBuySTL.OrigQuantity = Decimal('3.145');
        orderBuySTL.Side = 'Buy';
        orderBuySTL.OrderType = 'TrailingStopMarket';
        orderBuySTL.PegPriceType = 'Last';
        orderBuySTL.TrailingAmount = Decimal('50');
        
        const buyIdSTL = order.insert(orderBuySTL);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('870');
        orderBuy.Quantity = Decimal('3.145');
        orderBuy.OrigQuantity = Decimal('3.145');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('870');
        orderSell.Quantity = Decimal('3.145');
        orderSell.OrigQuantity = Decimal('3.145');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 2);

                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0', 'sell RemainingQuantity is 0');

                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0', 'sell Quantity is 0');

                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '3.145', 'buy QuantityExecuted is 3.145');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '3.145', 'sell QuantityExecuted is 3.145');

                chai.assert.equal(order.findOne({ _id: buyIdSTL }).StopPrice.toString(), '920', 'buySTL StopPrice is 920');
                chai.assert.equal(order.findOne({ _id: buyIdSTL }).QuantityExecuted.toString(), '0', 'buySTL QuantityExecuted is 0');
                done();
            } catch (e) {
                done(e);
            }
        }), 2000);
    });
    
    // Full test buy
    global.it('test Full trades StopPprice buy trailing stop market order by 1001 with stop price 900 with deal by 870 TrailingAmount 50 and PegPriceType Last', function (done) {
        this.timeout(10000);
        
        const orderBuySTL = EJSON.clone(orderInstance);
        orderBuySTL.UserId = userTaker.userId;
        orderBuySTL.StopPrice = Decimal('900'); // initial StopPrice
        orderBuySTL.Quantity = Decimal('3.145');
        orderBuySTL.OrigQuantity = Decimal('3.145');
        orderBuySTL.Side = 'Buy';
        orderBuySTL.OrderType = 'TrailingStopMarket';
        orderBuySTL.PegPriceType = 'Last';
        orderBuySTL.TrailingAmount = Decimal('50');
        
        const buyIdSTL = order.insert(orderBuySTL);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('870');
        orderBuy.Quantity = Decimal('3.145');
        orderBuy.OrigQuantity = Decimal('3.145');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('870');
        orderSell.Quantity = Decimal('3.145');
        orderSell.OrigQuantity = Decimal('3.145');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);
        
        const orderBuy2 = EJSON.clone(orderInstance);
        orderBuy2.UserId = userTaker.userId;
        orderBuy2.LimitPrice = Decimal('920');
        orderBuy2.Quantity = Decimal('3.145');
        orderBuy2.OrigQuantity = Decimal('3.145');
        orderBuy2.Side = 'Buy';
        
        const buyId2 = order.insert(orderBuy2);
        
        const orderSell2 = EJSON.clone(orderInstance);
        orderSell2.UserId = userMaker.userId;
        orderSell2.LimitPrice = Decimal('920');
        orderSell2.Quantity = Decimal('3.145');
        orderSell2.OrigQuantity = Decimal('3.145');
        orderSell2.Side = 'Sell';
        
        const sellId2 = order.insert(orderSell2);
        
        const orderSell3 = EJSON.clone(orderInstance);
        orderSell3.UserId = userMaker.userId;
        orderSell3.LimitPrice = Decimal('930.33');
        orderSell3.Quantity = Decimal('3.145');
        orderSell3.OrigQuantity = Decimal('3.145');
        orderSell3.Side = 'Sell';
        
        const sellId3 = order.insert(orderSell3);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                const buyIdSTL_new = order.findOne({ PreviousOrderRevision: buyIdSTL })._id;

                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId, buyId2, sellId2, buyIdSTL_new, sellId3] } }).count(), 6);

                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0', 'sell RemainingQuantity is 0');
                
                chai.assert.equal(trade.findOne({ OrderId: buyId2 }).RemainingQuantity.toString(), '0', 'buyId2 RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId2 }).RemainingQuantity.toString(), '0', 'sell2 RemainingQuantity is 0');
                
                chai.assert.equal(trade.findOne({ OrderId: buyIdSTL_new }).RemainingQuantity.toString(), '0', 'buyIdSTL RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId3 }).RemainingQuantity.toString(), '0', 'sell3 RemainingQuantity is 0');

                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: buyId2 }).Quantity.toString(), '0', 'buy2 Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0', 'sell Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId2 }).Quantity.toString(), '0', 'sell2 Quantity is 0');

                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '3.145', 'buy QuantityExecuted is 3.145');
                chai.assert.equal(order.findOne({ _id: buyId2 }).QuantityExecuted.toString(), '3.145', 'buy2 QuantityExecuted is 3.145');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '3.145', 'sell QuantityExecuted is 3.145');
                chai.assert.equal(order.findOne({ _id: sellId2 }).QuantityExecuted.toString(), '3.145', 'sell2 QuantityExecuted is 3.145');

                chai.assert.equal(order.findOne({ _id: buyIdSTL }).OrderState, 'Rejected', 'BuySTL Algo state is Rejected');
                chai.assert.equal(order.findOne({ _id: buyIdSTL }).StopPrice.toString(), '920', 'BuySTL StopPrice is 920');
                
                chai.assert.equal(order.findOne({ _id: buyIdSTL_new }).QuantityExecuted.toString(), '3.145', 'buySTL QuantityExecuted is 0');
                chai.assert.equal(order.findOne({ _id: buyIdSTL_new }).Quantity.toString(), '0', 'buySTL Quantity is 3.145');
                
                chai.assert.equal(order.findOne({ _id: sellId3 }).QuantityExecuted.toString(), '3.145', 'sell3 QuantityExecuted is 0');
                chai.assert.equal(order.findOne({ _id: sellId3 }).Quantity.toString(), '0', 'sell3 Quantity is 3.145');
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
    
    global.it('test StopPprice sell trailing stop market order by 1001 with stop price 900 with deal by 970 TrailingAmount 50 and PegPriceType Last', function (done) {
        this.timeout(10000);
        
        const orderSellSTL = EJSON.clone(orderInstance);
        orderSellSTL.UserId = userTaker.userId;
        orderSellSTL.StopPrice = Decimal('900'); // initial StopPrice
        orderSellSTL.Quantity = Decimal('3.145');
        orderSellSTL.OrigQuantity = Decimal('3.145');
        orderSellSTL.Side = 'Sell';
        orderSellSTL.OrderType = 'TrailingStopMarket';
        orderSellSTL.PegPriceType = 'Last';
        orderSellSTL.TrailingAmount = Decimal('50');
        
        const sellIdSTL = order.insert(orderSellSTL);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('970');
        orderBuy.Quantity = Decimal('3.145');
        orderBuy.OrigQuantity = Decimal('3.145');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('970');
        orderSell.Quantity = Decimal('3.145');
        orderSell.OrigQuantity = Decimal('3.145');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId] } }).count(), 2);

                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0', 'sell RemainingQuantity is 0');

                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0', 'sell Quantity is 0');

                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '3.145', 'buy QuantityExecuted is 3.145');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '3.145', 'sell QuantityExecuted is 3.145');

                chai.assert.equal(order.findOne({ _id: sellIdSTL }).StopPrice.toString(), '920', 'buySTL StopPrice is 920');
                chai.assert.equal(order.findOne({ _id: sellIdSTL }).QuantityExecuted.toString(), '0', 'buySTL QuantityExecuted is 0');
                done();
            } catch (e) {
                done(e);
            }
        }), 2000);
    });
    
    // Full test sell
    global.it('test Full trades StopPprice sell trailing stop market order by 1001 with stop price 900 with deal by 970 TrailingAmount 50 and PegPriceType Last', function (done) {
        this.timeout(10000);
        
        const orderSellSTL = EJSON.clone(orderInstance);
        orderSellSTL.UserId = userTaker.userId;
        orderSellSTL.StopPrice = Decimal('900'); // initial StopPrice
        orderSellSTL.Quantity = Decimal('3.145');
        orderSellSTL.OrigQuantity = Decimal('3.145');
        orderSellSTL.Side = 'Sell';
        orderSellSTL.OrderType = 'TrailingStopMarket';
        orderSellSTL.PegPriceType = 'Last';
        orderSellSTL.TrailingAmount = Decimal('50');
        orderSellSTL.LimitOffset = Decimal('10.33');
        
        const sellIdSTL = order.insert(orderSellSTL);
        
        const orderBuy = EJSON.clone(orderInstance);
        orderBuy.UserId = userTaker.userId;
        orderBuy.LimitPrice = Decimal('970');
        orderBuy.Quantity = Decimal('3.145');
        orderBuy.OrigQuantity = Decimal('3.145');
        orderBuy.Side = 'Buy';
        
        const buyId = order.insert(orderBuy);
        
        const orderSell = EJSON.clone(orderInstance);
        orderSell.UserId = userMaker.userId;
        orderSell.LimitPrice = Decimal('970');
        orderSell.Quantity = Decimal('3.145');
        orderSell.OrigQuantity = Decimal('3.145');
        orderSell.Side = 'Sell';
        
        const sellId = order.insert(orderSell);

        const orderBuy2 = EJSON.clone(orderInstance);
        orderBuy2.UserId = userTaker.userId;
        orderBuy2.LimitPrice = Decimal('920');
        orderBuy2.Quantity = Decimal('3.145');
        orderBuy2.OrigQuantity = Decimal('3.145');
        orderBuy2.Side = 'Buy';
        
        const buyId2 = order.insert(orderBuy2);
        
        const orderBuyTMS = EJSON.clone(orderInstance);
        orderBuyTMS.UserId = userTaker.userId;
        orderBuyTMS.LimitPrice = Decimal('930.33');
        orderBuyTMS.Quantity = Decimal('3.145');
        orderBuyTMS.OrigQuantity = Decimal('3.145');
        orderBuyTMS.Side = 'Buy';
        
        const buyIdTSM = order.insert(orderBuyTMS);
        
        const orderSell2 = EJSON.clone(orderInstance);
        orderSell2.UserId = userMaker.userId;
        orderSell2.LimitPrice = Decimal('920');
        orderSell2.Quantity = Decimal('3.145');
        orderSell2.OrigQuantity = Decimal('3.145');
        orderSell2.Side = 'Sell';
        
        const sellId2 = order.insert(orderSell2);
        
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                const sellIdSTL_new = order.findOne({ PreviousOrderRevision: sellIdSTL })._id;

                chai.assert.equal(trade.find({ OrderId: { $in: [buyId, sellId, buyId2, sellId2, sellIdSTL_new, buyIdTSM] } }).count(), 6);

                chai.assert.equal(trade.findOne({ OrderId: buyId }).RemainingQuantity.toString(), '0', 'buy RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId }).RemainingQuantity.toString(), '0', 'sell RemainingQuantity is 0');
                
                chai.assert.equal(trade.findOne({ OrderId: buyId2 }).RemainingQuantity.toString(), '0', 'buyId2 RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: sellId2 }).RemainingQuantity.toString(), '0', 'sell2 RemainingQuantity is 0');
                
                chai.assert.equal(trade.findOne({ OrderId: sellIdSTL_new }).RemainingQuantity.toString(), '0', 'sellIdSTL_new RemainingQuantity is 0');
                chai.assert.equal(trade.findOne({ OrderId: buyIdTSM }).RemainingQuantity.toString(), '0', 'buyIdTSM RemainingQuantity is 0');

                chai.assert.equal(order.findOne({ _id: buyId }).Quantity.toString(), '0', 'buy Quantity is 0');
                chai.assert.equal(order.findOne({ _id: buyId2 }).Quantity.toString(), '0', 'buy2 Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId }).Quantity.toString(), '0', 'sell Quantity is 0');
                chai.assert.equal(order.findOne({ _id: sellId2 }).Quantity.toString(), '0', 'sell2 Quantity is 0');

                chai.assert.equal(order.findOne({ _id: buyId }).QuantityExecuted.toString(), '3.145', 'buy QuantityExecuted is 3.145');
                chai.assert.equal(order.findOne({ _id: buyId2 }).QuantityExecuted.toString(), '3.145', 'buy2 QuantityExecuted is 3.145');
                chai.assert.equal(order.findOne({ _id: sellId }).QuantityExecuted.toString(), '3.145', 'sell QuantityExecuted is 3.145');
                chai.assert.equal(order.findOne({ _id: sellId2 }).QuantityExecuted.toString(), '3.145', 'sell2 QuantityExecuted is 3.145');

                chai.assert.equal(order.findOne({ _id: sellIdSTL }).OrderState, 'Rejected', 'SellSTL Algo state is Rejected');
                chai.assert.equal(order.findOne({ _id: sellIdSTL }).StopPrice.toString(), '920', 'SellSTL StopPrice is 920');
                
                chai.assert.equal(order.findOne({ _id: sellIdSTL_new }).QuantityExecuted.toString(), '3.145', 'sellSTL QuantityExecuted is 0');
                chai.assert.equal(order.findOne({ _id: sellIdSTL_new }).Quantity.toString(), '0', 'sellSTL Quantity is 3.145');
                
                chai.assert.equal(order.findOne({ _id: buyIdTSM }).QuantityExecuted.toString(), '3.145', 'buyIdTSM QuantityExecuted is 0');
                chai.assert.equal(order.findOne({ _id: buyIdTSM }).Quantity.toString(), '0', 'buyIdTSM Quantity is 3.145');
                done();
            } catch (e) {
                done(e);
            }
        }), 6000);
    });
});

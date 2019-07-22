import chai from 'chai';
import { Meteor } from 'meteor/meteor';
import { order, balance, api_key } from '/imports/collections';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { generateFakeDataInstruments } from '/imports/fakeData';
import '/imports/server/dbhooks.js';
import '/imports/server/jobs.js';
import '/imports/server/hooks.js';
import '/imports/server/api';
import { Decimal } from 'meteor/mongo-decimal';
import crypto from 'crypto';
import { HTTP } from 'meteor/http';
import { Roles } from 'meteor/alanning:roles';
import { _ } from 'meteor/underscore';
import { Accounts } from 'meteor/accounts-base';

global.describe('Orders API', function () {
    this.timeout(10000);
  
    let userTaker; let userMaker; let userMaker_Api;
    // let userTaker_Api; let authTokenTaker; let userIdTaker;
    let authTokenMaker; let
        userIdMaker;
  
    global.beforeEach(function(done) {
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
      
            setTimeout(Meteor.bindEnvironment(() => {
                /*
                userTaker_Api = api_key.findOne({ UserId: userTaker.userId });
          
                const hmacTaker = crypto.createHmac('sha256', userTaker_Api.Secret); // use your Secret
                hmacTaker.update(userTaker_Api.Key); // use your Key
    
                try {
                    new Promise((resolve) => {
                        HTTP.post('http://localhost:3000/api/v1/login',
                            {
                                headers: { 'X-API-Authorization': userTaker_Api.Key },
                                params: { key: userTaker_Api.Key, hash: hmacTaker.digest('hex') },
                                timeout: 10000,
                            },
                            Meteor.bindEnvironment(function(e, res) {
                                if (!e && res.statusCode == 200 && res.data) {
                                    authTokenTaker = res.data.data.authToken;
                                    userIdTaker = res.data.data.userId;
                                }
                                resolve();
                            }));
                    }).await();
                } catch (e) {
                    throw Meteor.Error('');
                }
                */
                userMaker_Api = api_key.findOne({ UserId: userMaker.userId });
          
                const hmacMaker = crypto.createHmac('sha256', userMaker_Api.Secret); // use your Secret
                hmacMaker.update(userMaker_Api.Key); // use your Key
          
                try {
                    new Promise((resolve) => {
                        HTTP.post('http://localhost:3000/api/v1/login',
                            {
                                headers: { 'X-API-Authorization': userMaker_Api.Key },
                                params: { key: userMaker_Api.Key, hash: hmacMaker.digest('hex') },
                                timeout: 10000,
                            },
                            Meteor.bindEnvironment(function(e, res) {
                                if (!e && res.statusCode == 200 && res.data) {
                                    authTokenMaker = res.data.data.authToken;
                                    userIdMaker = res.data.data.userId;
                                }
                                resolve();
                            }));
                    }).await();
                } catch (e) {
                    throw Meteor.Error('');
                }
          
                done();
            }), 1000);
        });
    });
  
    /**
     * Send order
    * */
    global.it('send with signature', function (done) {
        this.timeout(11000);
        
        const dataObj = {
            Quantity: '0.00012345656',
            LimitPrice: '300.00000001',
            OrderType: 'Limit',
            InstrumentSymbol: 'BTC_ETH',
            Side: 'Buy',
            recvWindow: '5000',
            timestamp: new Date().getTime(),
        };

        const dataObjPlain = [];
        const entries = Object.entries(dataObj);
        for (let i = 0; i < entries.length; i += 1) {
            const [key, value] = entries[i];
            dataObjPlain.push(`${key}=${value}`);
        }
        
        const hmacSignature = crypto.createHmac('sha256', userMaker_Api.Secret); // use your Secret
        hmacSignature.update(dataObjPlain.join('&')); // signature

        dataObj.signature = hmacSignature.digest('hex');

        let OrderId;
        
        new Promise((resolve) => {
            HTTP.post('http://localhost:3000/api/v1/sendorder',
                {
                    headers: {
                        'X-API-Authorization': userMaker_Api.Key,
                        'X-Auth-Token': authTokenMaker,
                        'X-User-Id': userIdMaker,
                    },
                    params: dataObj,
                    timeout: 10000,
                },
                Meteor.bindEnvironment(function(e, res) {
                    if (!e && res.statusCode == 200 && res.data) {
                        ({ OrderId } = res.data.data);
                    }
                    resolve();
                }));
        }).await();
            
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                const _order = order.findOne({ _id: OrderId });
                chai.assert.equal(_.isUndefined(_order), false, 'Api created order');
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
});

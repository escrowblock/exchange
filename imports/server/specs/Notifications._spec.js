import { Meteor } from 'meteor/meteor';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import { generateFakeDataInstruments } from '/imports/fakeData';
import '/imports/server/dbhooks.js';
import '/imports/server/jobs.js';
import '/imports/server/hooks.js';
import { profile } from '/imports/collections';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';

global.describe('Notifications', function () {
    this.timeout(10000);
    
    let userTaker; let
        userMaker;
    
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
                    encryptionpublickey: 'nFxp+ZRkfG3FRJOAp1TM46REHqXHBgyloazLNe+J+XE=',
                },
                {});
            
            profile.update({ UserId: userTaker.userId }, { $set: { Email: 'support@escb.exchange' } });
            
            userMaker = Accounts.updateOrCreateUserFromExternalService('ethereum',
                {
                    id: '0xf593ca6A1D5013298F7dE87AF4386A807C02F7e8',
                    signature: '0x4d6d5047b1be60f4d158be8c6e2e5022ad3ea02b7c6f083338c53e86109a11c1335d58480b66707270c13fdef7c0479a44ba2fe224f5c078574307b01229ee361b',
                    publickey: 'dd036f14b0198dae36381242e1b47d249909446699d79bf1a478e7efe274c8caa54584ff908beb900e317b7ac535941815fd605816c33a8bbcca7f027058508b',
                    encryptionpublickey: 'fLCuEBf7FMygt2/lGHFyk4+/vEhjoE4ouZOsQZt+OXQ=',
                },
                {});
            
            profile.update({ UserId: userMaker.userId }, { $set: { Email: 'support@escb.exchange' } });

            done();
        });
    });
    
    /**
     * Test Notifications
    * */
    global.it('send notifications', function (done) {
        this.timeout(10000);
        
        // sendNotification("Test", "test notification", userMaker.userId, '/');
            
        setTimeout(Meteor.bindEnvironment(() => {
            try {
                done();
            } catch (e) {
                done(e);
            }
        }), 5000);
    });
});

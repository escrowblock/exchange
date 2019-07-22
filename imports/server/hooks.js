import {
    profile, api_key, referral_program, referral_program_agg,
} from '/imports/collections.js';
import sendNotification from '/imports/notifications.js';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { Roles } from 'meteor/alanning:roles';
import { _ } from 'meteor/underscore';
import { Accounts } from 'meteor/accounts-base';
import crypto from 'crypto';

Meteor.users.after.insert(function (userId, doc) {
    const currentTime = new Date().getTime();
    const roles = ['client'];
    if (Meteor.users.find().count() === 1) {
        roles.push('admin');
        roles.push('arbitrage');
    }
  
    Roles.addUsersToRoles(doc._id, roles, Roles.GLOBAL_GROUP);

    let ReferrerId = '';
    if (doc.profile) {
        ReferrerId = doc.profile.ReferrerId ? doc.profile.ReferrerId : '';
    }
  
    profile.insert({
        UserId: doc._id,
        ReferrerId,
        AffiliateId: Random.id(),
    }, function() {
        api_key.insert({
            UserId: doc._id,
            Key: Random.secret(),
            Secret: Random.secret(),
            TimeStamp: currentTime,
        });
    });

    if (ReferrerId && !_.isUndefined(profile.findOne({ AffiliateId: ReferrerId }))) {
        referral_program.insert({
            UserId: doc._id,
            ReferrerId,
            TimeStamp: currentTime,
        }, function() {
            if (referral_program_agg.findOne({ UserId: ReferrerId })) {
                referral_program_agg.update(
                    { UserId: ReferrerId },
                    { $inc: { Total: 1 }, $set: { TimeStamp: currentTime } },
                );
            } else {
                referral_program_agg.insert({ UserId: ReferrerId, TimeStamp: currentTime, Total: 1 });
            }
        });
    }
});

Accounts.validateLoginAttempt((options) => {
    if (options.user) {
        if (!Roles.userIsInRole(options.user, ['client'])) {
            throw new Meteor.Error(403, 'Login forbidden');
        }
        const _profile = profile.findOne({ UserId: options.user._id });
        if (_.isUndefined(_profile)) {
            throw new Meteor.Error(403, "Account doesn't exist");
        }
        if (!_.isUndefined(_profile) && !_.isUndefined(_profile.status)) {
            switch (_profile.status) {
            case 'blocked':
                throw new Meteor.Error(403, "You can't login - your account is blocked, contact with administration");
                // break;
            case 'deleted':
                throw new Meteor.Error(403, "You can't login - your account is deleted, contact with administration");
                // break;
            default:
                break;
            }
        }
    }
    return true;
});

/**
 * Hook for Restivus
* */
Accounts._findExtUser = function(serviceName, params) {
    if (!params.key) {
        return false; // don't handle
    }

    check(params, {
        key: String,
        hash: String,
    });

    if (serviceName == 'apiKey' && params.key && params.key && params.key && params.hash) {
        const _obj = api_key.findOne({ Key: params.key });
        if (_.isUndefined(_obj)) {
            throw new Meteor.Error(403, "You can't login with this API key and hash");
        }
        const hmac = crypto.createHmac('sha256', _obj.Secret);
        hmac.update(params.key);
        if (hmac.digest('hex') != params.hash) {
            throw new Meteor.Error(403, "You can't login with this API key and hash");
        }
        return _obj.UserId;
    }
    
    return false;
};

// OTP
Accounts.onLogin((info) => {
    if (info.type == 'ethereum') {
        if (_.isUndefined(profile.findOne({ UserId: info.user._id })) || !profile.findOne({ UserId: info.user._id }).UseOTP) {
            return true;
        }
        Meteor.users.update(info.user._id, { $set: { 'onePassCode.onLogin': true } });
    }
    return true;
});

// WhiteList IP
Accounts.onLogin((info) => {
    // API case
    if (info.connection.id == null) {
        return true;
    }

    import { UserWhiteList, Firewall, SHA256 } from 'meteor/logvik:user-ip-whitelist/server/main.js';

    const environment = new UserWhiteList();
    const firewall = new Firewall();
    const ip = String(SHA256(info.connection.clientAddress)).toLowerCase(); // Don't need store real IP for security

    if (_.isUndefined(profile.findOne({ UserId: info.user._id })) || !profile.findOne({ UserId: info.user._id }).UseWhiteListIP) {
        return true;
    }

    if (!firewall.allow(ip, environment, info.user._id)) {
        if (Meteor.users.findOne(info.user._id) && (!Meteor.users.findOne(info.user._id).pinCodeWhiteList
                                                || Meteor.users.findOne(info.user._id).pinCodeWhiteList.ip != ip)
        ) {
            const pinCode = String(Random.id()).substr(0, 6);
            Meteor.users.update(info.user._id, { $set: { pinCodeWhiteList: { pinCode, ip }, 'profile.pinCodeActivate': true } });
            const subject = 'Your access Pin Code';
            const text = 'We detected an attempt to login to your account from a new IP address, please use this pin-code to verify that %s';
            sendNotification(TAPi18n.__(subject), TAPi18n.__(text, pinCode), info.user._id, '/profile');
        }
    }
    return true;
});

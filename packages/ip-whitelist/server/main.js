const SHA256 = Npm.require('crypto-js/sha256');

const UserWhiteList = function () {
    /**
   * Extracts the whitelist of hashed IP addresses from the user.
   *
   * @method getList
   * @private
   *
   * @return {Array} An array of hashed IP addresses.
   */
    const getList = function(userId) {
        if (Meteor.users.findOne(userId)
       && Meteor.users.findOne(userId).whiteList) {
            return Meteor.users.findOne(userId).whiteList;
        }
        return [];
    };

    /**
   * Add new Ip to the whitelist for the user.
   *
   * @method getList
   * @private
   *
   * @return void.
   */
    const addNewIp = function(userId, ip) {
        if (Meteor.users.findOne(userId)
       && Meteor.users.findOne(userId).whiteList) {
            Meteor.users.update(userId, { $addToSet: { whiteList: ip } });
        } else {
            Meteor.users.update(userId, { $set: { whiteList: [ip] } });
        }
    };

    /**
   * Remove old Ip from the whitelist for the user.
   *
   * @method getList
   * @private
   *
   * @return void.
   */
    const removeOldIp = function(userId, ip) {
        if (Meteor.users.findOne(userId)
       && Meteor.users.findOne(userId).whiteList) {
            Meteor.users.update(userId, { $pull: { whiteList: ip } });
        }
    };

    // The public API
    return {
        getList,
        addNewIp,
        removeOldIp,
    };
};

/**
 * Module the handles the allow/deny IP rule logic.
 *
 * @module Firewall
 */
const Firewall = function () {
    /**
     * Decides whether or not to allow an IP address.
     *
     * @method allow
     * @public
     *
     * @param {Array} ip The IP address being checked.
     * @param {Array} whitelist The IP address whitelist.
     *
     * @return {Boolean} True if IP is allowed access, false if not.
     */
    const allow = function(ip, environment, userId) {
        if (!userId) {
            return true;
        }
        const whitelist = environment.getList(userId);
        if (whitelist.length === 0) {
            environment.addNewIp(userId, ip);
            return true;
        }
        let allowed = false;

        if (whitelist.indexOf(ip) !== -1) {
            allowed = true;
            Meteor.users.update(userId, { $unset: { pinCodeWhiteList: 1, 'profile.pinCodeActivate': 1 } });
        }
        return allowed;
    };

    // The public API
    return {
        allow,
    };
};

export { UserWhiteList, Firewall, SHA256 };

Iron.Router.plugins.userIPWhitelist = function (router, options) {};
  
Meteor.methods({
    checkPinCode(pinCode) {
        const obj = Meteor.users.findOne({ _id: Meteor.userId(), 'pinCodeWhiteList.pinCode': pinCode });
        if (obj) {
            const environment = new UserWhiteList();
            environment.addNewIp(Meteor.userId(), obj.pinCodeWhiteList.ip);
            Meteor.users.update(Meteor.userId(), { $unset: { pinCodeWhiteList: 1, 'profile.pinCodeActivate': 1 } });
            return true;
        }
        throw new Meteor.Error('Pin code is wrong.');
    },
});

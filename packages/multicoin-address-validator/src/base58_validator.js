var cryptoUtils = require('./crypto/utils');

module.exports = {
    isValidAddress: function (address) {
        if (typeof (address) !== 'string') {
            return false;
        }
        if (address.length <= 4) {
            return false;
        }
    
        try {
            cryptoUtils.base58(address);
        } catch (e) {
            return false;
        }

        return true;
    }
};

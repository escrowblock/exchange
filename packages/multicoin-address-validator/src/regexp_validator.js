var cryptoUtils = require('./crypto/utils');

module.exports = {
    isValidAddress: function (address, currency, networkType) {
        return new RegExp(currency.regex).test(address);
    }
};

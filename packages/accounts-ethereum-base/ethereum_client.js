// Attempt to log in with a ethereum.
//
// @param address {String}
// @param signature {String}
// @param callback {Function(error|undefined)}

/**
 * @summary Log the user in with ethereum.
 * @locus Client
 * @param {String} address
 *   A string interpreted as wallet address
 * @param {String} signature The user's signature.
 * @param {Function} [callback] Optional callback.
 *   Called with no arguments on success, or with a single `Error` argument
 *   on failure.
 * @importFromPackage meteor
 */
Meteor.loginWithEthereum = (address, signature, options, callback) => {
    Accounts.callLoginMethod({
        methodArguments: [Object.assign({
            ethereum: { address, signature },
        }, options)],
        userCallback: (error, result) => {
            if (error) {
                if (error.error == 403) {
                    Accounts.callLoginMethod({
                        methodName: 'createUser',
                        methodArguments: [Object.assign({
                            ethereum: { address, signature },
                        }, options)],
                        userCallback: (error, result) => {
                            if (error) {
                                callback(error, null);
                            } else {
                                callback(null, true);
                            }
                        },
                    });
                } else if (callback) {
                    callback(error, null);
                } else {
                    throw error;
                }
            } else {
                callback && callback(null, result);
            }
        },
    });
};

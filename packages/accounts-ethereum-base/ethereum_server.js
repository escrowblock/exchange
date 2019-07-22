// Listen to calls to `login` with an ethereum option set. This is where
// users actually get logged in to meteor via ethereum.
const util = Npm.require('ethereumjs-util');

// code to run on server at startup
Meteor.startup(function () {
    Accounts._options.forbidClientAccountCreation = false;
});

Accounts.registerLoginHandler((options) => {
    if (!options.ethereum) return undefined; // don't handle

    check(options.ethereum, {
        address: String,
        signature: String,
    });

    // Store a public key for "talks"
    const msg = 'The footprint for authentication';
    const msgBuffer = util.toBuffer(msg);
    const msgHash = util.hashPersonalMessage(msgBuffer);
    const signatureBuffer = util.toBuffer(options.ethereum.signature);
    const signatureParams = util.fromRpcSig(signatureBuffer);
    const publickey = util.ecrecover(
        msgHash,
        signatureParams.v,
        signatureParams.r,
        signatureParams.s,
    );

    const _opt = Object.assign({}, options);
    delete _opt.ethereum;
  
    return Accounts.updateOrCreateUserFromExternalService('ethereum',
        { id: options.ethereum.address, signature: options.ethereum.signature, publickey: publickey.toString('hex') },
        _opt);
});

import cryptoMsg from 'meteor/escb:web3-crypto-message';

export const decryptMessage = function(encryptedMessage, identity) {
    return cryptoMsg.decryptWithPrivateKey(
        identity.privateKey,
        encryptedMessage,
    );
};

export const encryptMessage = function (message, identity) {
    return cryptoMsg.encryptWithPublicKey(
        identity.publicKey,
        message,
    );
};

import cryptoMsg from 'meteor/escb:web3-crypto-message';

export const decryptMessage = async function(encryptedMessage, identity) {
    const message = await cryptoMsg.decryptWithPrivateKey(
        identity.privateKey,
        encryptedMessage,
    );
    return message;
};

export const encryptMessage = async function (message, identity) {
    const encryptedMessage = cryptoMsg.cipher.stringify(
        await cryptoMsg.encryptWithPublicKey(
            identity.publicKey,
            message,
        ),
    );
    return encryptedMessage;
};

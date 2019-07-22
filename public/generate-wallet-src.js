const ETHWallet = require('ethereumjs-wallet');

self.onmessage = function(e) {
    const personal_wallet = ETHWallet.generate();
    const v3json = personal_wallet.toV3String(e.data.newPassword, { kdf: 'scrypt', n: '1024' });
    postMessage({ privateKey: personal_wallet.getPrivateKey(), v3json });
};

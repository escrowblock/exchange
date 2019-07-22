Package.describe({
    name: 'escb:web3-crypto-message',
    version: '1.0.1',
    git: 'https://github.com/escb/web3-crypto-message.git',
    documentation: 'README.md',
    summary: 'Simple encrypted messaging between many web3 users',
});

// This lets you use npm packages in your package:
Npm.depends({
    eccrypto: '1.1.1',
    'eth-lib': '0.2.8',
    'ethereumjs-util': '6.1.0',
    ethers: '4.0.28',
    secp256k1: '3.7.0',
});

Package.on_use(function (api) {
    api.versionsFrom('1.6');
    api.use([
        'meteor',
        'modules',
        'ecmascript',
        'underscore',
    ]);

    api.mainModule('lib/index.js', ['client', 'server']);
});

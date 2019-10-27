Package.describe({
    name: 'escb:multicoin-address-validator',
    version: '1.0.1',
    git: 'https://github.com/escrowblock/multicoin-address-validator.git',
    documentation: 'README.md',
    summary: 'Address validator for various coins',
});

// This lets you use npm packages in your package:
Npm.depends({
    "base-x": "3.0.5",
    "browserify-bignum": "1.3.0-2",
    "cbor-js": "0.1.0",
    "crc": "3.8.0",
    "jssha": "2.3.1"
});

Package.on_use(function (api) {
    api.versionsFrom('1.6');
    api.use([
        'meteor',
        'modules',
        'ecmascript',
        'underscore',
    ]);

    api.mainModule('src/wallet_address_validator.js', ['client', 'server']);
});

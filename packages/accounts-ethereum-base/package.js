Package.describe({
    summary: 'Ethereum-blockchain base support for accounts',
    version: '1.0.1',
    name: 'escb:accounts-ethereum-base',
});

Npm.depends({
    'ethereumjs-util': '6.1.0',
});

Package.onUse((api) => {
    api.use([
        'accounts-base',
        'sha',
        'ejson',
        'ddp',
    ], ['client', 'server']);

    // Export Accounts (etc) to packages using this one.
    api.imply('accounts-base', ['client', 'server']);

    api.use('random', 'server');
    api.use('ecmascript');

    api.addFiles('ethereum_server.js', 'server');
    api.addFiles('ethereum_client.js', 'client');
});

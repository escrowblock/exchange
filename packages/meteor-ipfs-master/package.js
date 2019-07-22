Package.describe({
    name: 'escb:meteor-ipfs',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: 'run IPFS from meteor',
    // URL to the Git repository containing the source code for this package.
    git: 'https://github.com/escb/meteor-ipfs',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md',
});

Npm.depends({
    'ipfs-http-client': '30.1.0',
    'fs-extra': '7.0.1',
    request: '2.88.0',
    shelljs: '0.8.3',
    'es6-symbol': '3.1.1',
});

Package.onUse(function (api) {
    api.versionsFrom('1.2.1');
    api.use('ecmascript');
    api.use('ejson');
    api.use('check', 'server');
    api.use('underscore', 'server');
    api.use('sanjo:long-running-child-process@1.1.3', 'server');
    api.use('practicalmeteor:loglevel@1.1.0_2', 'server');
    api.addFiles(['lib/ipfsConnector.js'], 'server');
    api.export('IpfsConnector', 'server');
});

Package.onTest(function (api) {
    api.use('ecmascript');
    api.use('escb:meteor-ipfs');
    api.use('sanjo:jasmine@0.20.3');
    api.addFiles(['tests/server/integration/ipfsConnector-spec.js'], 'server');
});

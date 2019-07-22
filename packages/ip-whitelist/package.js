Package.describe({
    name: 'logvik:user-ip-whitelist',
    version: '1.0.1',
    summary: 'Restrict access for a user from not whitelisted IP addresses. A user must confirm an access via pin-code by email.',
    git: 'https://github.com/logvik/user-ip-whitelist.git',
    documentation: 'README.md',
});

Package.onUse(function(api) {
    api.versionsFrom('1.6');

    api.use([
        'accounts-base',
        'meteor',
        'check',
        'ecmascript',
        'templating',
        'underscore',
        'mongo',
        'sha',
    ]);

    api.use([
        'useraccounts:core',
    ], ['client', 'server']);

    api.use('deps', 'client');
    api.use('ecmascript', 'server');
    api.use('webapp', 'server');
    api.use('random', 'server');

    api.addFiles([
        'server/main.js',
    ], 'server');

    api.add_files([
        'client/pinCode.html',
        'client/routerPlugin.js',
        'client/pinCode.js',
    ], 'client');
});

Npm.depends({
    'crypto-js': '3.1.9-1',
});

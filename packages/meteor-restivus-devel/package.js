Package.describe({
    name: 'logvik:restivus',
    summary: 'Create authenticated REST APIs in Meteor 1.6 via HTTP/HTTPS. Setup CRUD endpoints for Collections.',
    version: '0.0.1',
    git: 'https://github.com/logvik/meteor-restivus.git',
});

Package.onUse(function (api) {
    // Meteor dependencies
    api.use('check');
    api.use('underscore');
    api.use('meteor');
    api.use('sha');
    api.use('accounts-base');
    api.use('accounts-password');
    api.use('useraccounts:core');
    api.use('simple:json-routes@2.1.0');

    api.addFiles('lib/auth.js', 'server');
    api.addFiles('lib/iron-router-error-to-response.js', 'server');
    api.addFiles('lib/route.js', 'server');
    api.addFiles('lib/restivus.js', 'server');

    // Exports
    api.export('Restivus', 'server');
});

Package.onTest(function (api) {
    // Meteor dependencies
    api.use('practicalmeteor:munit');
    api.use('test-helpers');
    api.use('logvik:restivus');
    api.use('http');
    api.use('underscore');
    api.use('accounts-base');
    api.use('accounts-password');
    api.use('mongo');

    api.addFiles('lib/route.js', 'server');
    api.addFiles('test/api_tests.js', 'server');
    api.addFiles('test/route_unit_tests.js', 'server');
    api.addFiles('test/authentication_tests.js', 'server');
    api.addFiles('test/user_hook_tests.js', 'server');
});

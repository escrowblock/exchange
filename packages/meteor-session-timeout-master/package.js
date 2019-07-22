Package.describe({
    name: 'logvik:autologout',
    version: '1.0.1',
    git: 'https://github.com/logvik/autologout.git',
    documentation: 'README.md',
    summary: 'Simple configurable session timeout',
});

Package.on_use(function (api) {
    api.use(['coffeescript', 'underscore'], ['server', 'client']);
    api.use(['accounts-base'], 'server');
    api.use(['jquery', 'deps'], 'client');
    api.add_files([
        'server/server_timeout.coffee',
        'server/login_helper.coffee'], 'server');
    api.add_files('client/client_timeout.coffee', 'client');
});

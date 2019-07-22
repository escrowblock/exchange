Package.describe({
    name: 'logvik:react-stockcharts',
    version: '1.0.1',
    summary: 'Package for displaying stockcharts.',
    git: 'https://github.com/logvik/react-stockcharts.git',
    documentation: 'README.md',
});

Package.onUse(function(api) {
    api.versionsFrom('1.6');

    api.use([
        'meteor',
        'check',
        'templating',
        'ecmascript',
        'underscore',
        'react-template-helper',
        'mongo',
    ]);

    api.add_files([
        'client/index.js',
    ], 'client');
});

Package.onTest(function(api) {

});

// This lets you use npm packages in your package:
Npm.depends({
    'd3-dsv': '1.0.8',
    'd3-format': '1.2.1',
    'd3-scale': '1.0.7',
    'd3-time-format': '2.1.1',
    'prop-types': '15.6.0',
    react: '16.2.0',
    'react-dom': '16.8.6',
    'react-stockcharts': '0.7.8',
    shortid: '2.2.8',
});

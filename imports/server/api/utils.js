import Api from './config.js';

/**
 * Server time
 */
Api.addRoute('ping', {
    authRequired: false,
    enableCors: true,
},
{
    get: {
        action() {
            return {
                status: 'success',
                timestamp: new Date().getTime(),
                data: {},
            };
        },
    },
});

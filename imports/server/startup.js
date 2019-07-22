import { Meteor } from 'meteor/meteor';

// code to run on server at startup
Meteor.startup(() => {
    import { product, instrument, schemas } from '/imports/collections.js';
    import { IpfsConnector } from 'meteor/escb:meteor-ipfs';
    import { Decimal } from 'meteor/mongo-decimal';
    import { SSL } from 'meteor/nourharidy:ssl';
    import { _ } from 'meteor/underscore';
    import { Inject } from 'meteor/meteorhacks:inject-initial';
    import { Mailer } from 'meteor/lookback:emails';
    import { Push } from 'meteor/raix:push';
    import { Roles } from 'meteor/alanning:roles';
    import { Accounts } from 'meteor/accounts-base';
    import { HTTP } from 'meteor/http';
    import { EJSON } from 'meteor/ejson';
    import { base, quote } from '/imports/initialCoins';
    
    if (Meteor.settings.private.lhttps) {
        SSL(
            global.Assets.absoluteFilePath('certificates/localhost.key'),
            global.Assets.absoluteFilePath('certificates/localhost.cert'),
            443,
        );
    }

    Inject.rawBody('app-downloading-spinner', '<div id="app-downloading-spinner" class="spinner-container"><img style="width: 100px; height: 100px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" src="/img/ajax-loader.gif" alt="loader"></div>');

    Push.Configure({
        gcm: {
            apiKey: Meteor.settings.private.gcmKey, // GCM/FCM server key
        },
        // production: true,
        sound: true,
        badge: true,
        alert: true,
        vibrate: true,
        sendInterval: 15000, // Configurable interval between sending
        sendBatchSize: 1, // Configurable number of notifications to send per batch
        // 'keepNotifications': false
    });

    if (Meteor.roles.find().count() == 0) {
        Roles.createRole('admin');
        Roles.createRole('client');
        Roles.createRole('arbitration');
    }

    Accounts.emailTemplates.siteName = Meteor.settings.public.sitename;
    Accounts.emailTemplates.from = Meteor.settings.public.contactmail;

    Mailer.config({
        from: Meteor.settings.public.contactmail, // Default 'From:' address. Required.
        replyTo: Meteor.settings.public.contactmail, // Defaults to `from`.
        routePrefix: 'emails', // Route prefix.
        baseUrl: Meteor.absoluteUrl(), // The base domain to build absolute link URLs from in the emails.
        testEmail: null, // Default address to send test emails to.
        // logger: null,                     // Injected logger (see further below)
        silent: Meteor.settings.public.debug, // If set to `true`, any `Logger.info` calls won't be shown in the console to reduce clutter.
        addRoutes: Meteor.settings.public.debug, // Add routes for previewing and sending emails. Defaults to `true` in development.
        language: 'html', // The template language to use. Defaults to 'html', but can be anything Meteor SSR supports (like Jade, for instance).
        plainText: true, // Send plain text version of HTML email as well.
        plainTextOpts: {}, // Options for `html-to-text` module. See all here: https://www.npmjs.com/package/html-to-text
    });

    const Templates = {};

    Templates.notification = {
        path: 'templates/notification.html',
        route: {
            path: '/templatePreview/notification',
            data() {
                return {
                    header: 'Notification',
                    message: 'Test message',
                };
            },
        },
    };

    Mailer.init({
        templates: Templates,
    });

    if (product.find().count() === 0) {
        _.map(base, function (baseObjArg) {
            const baseObj = Object.assign({}, baseObjArg);
            if (_.isUndefined(product.findOne({ ProductSymbol: baseObj.ProductSymbol }))) {
                baseObj.DepositStatus = 'Running';
                baseObj.WithdrawStatus = 'Running';
                if (baseObj.ProductType == 'NationalCurrency') {
                    baseObj.Deferred = true;
                }
                product.insert(baseObj);
            }
        });
    
        _.map(quote, function (quoteObjArg) {
            const quoteObj = Object.assign({}, quoteObjArg);
            if (_.isUndefined(product.findOne({ ProductSymbol: quoteObj.ProductSymbol }))) {
                quoteObj.DepositStatus = 'Running';
                quoteObj.WithdrawStatus = 'Running';
                if (quoteObj.ProductType == 'NationalCurrency') {
                    quoteObj.Deferred = true;
                }
                product.insert(quoteObj);
            }
        });
    }
  
    if (instrument.find().count() === 0) {
        console.log(instrument.find().count());
        _.map(base, function(baseObj) {
            _.map(quote, function(quoteObj) {
                if (baseObj.ProductSymbol !== quoteObj.ProductSymbol) {
                    if (quoteObj.ProductType === 'NationalCurrency') {
                        if (_.indexOf(['ADA', 'BCH', 'BNB', 'BTC', 'ETH', 'EOS', 'ESCB', 'LTC', 'USDT', 'XML', 'XRP'], baseObj.ProductSymbol) !== -1) {
                            instrument.insert({
                                InstrumentSymbol: `${baseObj.ProductSymbol}_${quoteObj.ProductSymbol}`,
                                Product1Symbol: baseObj.ProductSymbol,
                                Product2Symbol: quoteObj.ProductSymbol,
                                SessionStatus: 'Running',
                                PreviousSessionStatus: 'Stopped',
                                QuantityIncrement: Decimal('0.0000000001'),
                                MaxQuantity: Decimal('10000000'),
                                MinQuantity: Decimal('0.0000001'),
                            });
                        }
                    } else {
                        instrument.insert({
                            InstrumentSymbol: `${baseObj.ProductSymbol}_${quoteObj.ProductSymbol}`,
                            Product1Symbol: baseObj.ProductSymbol,
                            Product2Symbol: quoteObj.ProductSymbol,
                            SessionStatus: 'Running',
                            PreviousSessionStatus: 'Stopped',
                            QuantityIncrement: Decimal('0.0000000001'),
                            MaxQuantity: Decimal('10000000'),
                            MinQuantity: Decimal('0.0000001'),
                        });
                    }
                }
            });
        });
    }
  
    /**
     * Start IPFS
     * */
    if (!_.isUndefined(Meteor.settings.public.ipfs) && Meteor.settings.public.ipfs) {
        global.ipfs = IpfsConnector.getInstance();
    
        if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
            global.ipfs.setLogLevel('info'); // info is default
        }
    
        global.ipfs.start();
    }
  
    /**
     * Add webhook to Telegram
     * */
    if (Meteor.settings.private.telegramToken) {
        // Telegram Bot
        const telegram_url = `https://api.telegram.org/bot${Meteor.settings.private.telegramToken}/`;
        try {
            const webhookInfo = new Promise((resolve) => {
                HTTP.get(`${telegram_url}getWebhookInfo`, function(e, res) {
                    if (!e && res && res.statusCode === 200) {
                        resolve(JSON.parse(res.content));
                    } else {
                        console.warn('Can not connect to telegram API.');
                    }
                });
            }).await();
            if (webhookInfo.result.url == '') {
                if (Meteor.absoluteUrl().indexOf('https://') != -1) {
                    new Promise((resolve) => {
                        HTTP.post(`${telegram_url}setWebhook`, {
                            params: {
                                url: `${Meteor.absoluteUrl()}${Meteor.settings.private.telegramToken}`,
                            },
                            timeout: 4000,
                        },
                        function(e, res) {
                            if (!e && res && res.statusCode === 200) {
                                console.log('setWebhook', res.content);
                                resolve(JSON.parse(res.content));
                            } else {
                                console.warn(res.content);
                            }
                        });
                    }).await();
                } else {
                    console.warn('Your url must have https:// for Telegram web hook');
                }
            }
        } catch (e) {
            // @DEBUG
            if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
                console.log(EJSON.stringify(e));
            }
            //
        }
    }
    

    global.SyncedCron._collection.attachSchema(schemas.cronHistory);
    
    // Server hooks
    import '/imports/server/hooks.js';
    
    // Server db hooks
    import '/imports/server/dbhooks.js';
    
    // Server jobs
    import '/imports/server/jobs.js';
    
    // Admin
    import '/imports/server/admin';
    
    // Server api
    import '/imports/server/api';
    
    // Server routers
    import '/imports/server/routers';
    
    // Server publications
    import '/imports/server/publications';
    
    // Server methods
    import '/imports/server/methods';
});

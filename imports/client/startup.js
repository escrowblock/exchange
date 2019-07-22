import { Meteor } from 'meteor/meteor';
import { variable } from '/imports/collections';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { Push } from 'meteor/raix:push';
import { TAPi18n } from 'meteor/tap:i18n';
import { AutoForm } from 'meteor/aldeed:autoform';
import { moment } from 'meteor/momentjs:moment';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { EJSON } from 'meteor/ejson';

// code to run on server at startup
Meteor.startup(function () {
    setTimeout(function() {
        $('#app-downloading-spinner').fadeOut(500, function() { $(this).remove(); });
    }, 500);

    Tracker.autorun(() => {
        const blockchain = variable.findOne({ name: 'blockchain' });
        if (!_.isUndefined(blockchain) && !_.isUndefined(blockchain.value)) {
            const blockchain_json = EJSON.parse(blockchain.value);
            Meteor.settings.public.blockchain = blockchain_json;
        }
    });

    Push.Configure({
        android: {
            senderID: Meteor.settings.public.senderID,
            alert: true,
            badge: true,
            sound: true,
            vibrate: true,
            clearNotifications: true,
            icon: 'push-icon',
        },
        ios: {
            alert: true,
            badge: true,
            sound: true,
        },
    });

    AutoForm.setDefaultTemplate('semanticUI');
  
    if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
        AutoForm.debug();
    }

    if (!Meteor.isCordova) {
        let lang = Meteor.userId() && !_.isUndefined(Meteor.user()) && Meteor.user().profile ? Meteor.user().profile.language : 'en';
        if (!_.isUndefined(Meteor.settings.public.languageOverride)) {
            Session.set('currentLanguage', Meteor.settings.public.languageOverride);
            lang = Meteor.settings.public.languageOverride;
        }

        if (Session.get('currentLanguage')) {
            lang = Session.get('currentLanguage');
        }

        TAPi18n.setLanguage(lang)
            .done(function () {
                Session.set('currentLanguage', lang);
                moment.locale(lang);
                /* setup menu dropdown */
                $('.menu .ui.dropdown').dropdown('set selected', lang);
                if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
                    console.log(`Language was set in ${Session.get('currentLanguage')}`);
                }
            })
            .fail(function (error_message) {
                // Handle the situation
                console.log(error_message);
            });
    } else {
        document.addEventListener('deviceready', function() {
            navigator.globalization.getLocaleName(
                function (locale) {
                    // console.log(`locale: ${locale.value}\n`);
                    const locale_array = String(locale.value).split('-');
                    const lang = Meteor.userId() && !_.isUndefined(Meteor.user()) && Meteor.user().profile ? Meteor.user().profile.language : locale_array[0];
                    // console.log(lang);

                    Session.set('currentLanguage', lang);

                    TAPi18n.setLanguage(lang)
                        .done(function () {
                            moment.locale(lang);
                            if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
                                console.log(`Language was set in ${lang}`);
                            }
                            /* setup menu dropdown */
                            $('.menu .ui.dropdown').dropdown('set selected', lang);
                        })
                        .fail(function (error_message) {
                            // Handle the situation
                            console.log(error_message);
                        });
                },
                function () {
                    console.log('Error getting locale\n');
                },
            );
        }, false);
    }
    
    // UI elements
    import '/imports/client/templates/UiElements';
    
    // Navigation
    import '/imports/client/templates/AppNavigation';

    // Main layout
    import '/imports/client/layouts/ApplicationLayout';
    
    // Admin layout
    import '/imports/client/layouts/AdminLayout';
    
    // Templates
    import '/imports/client/templates/NotFound';
    import '/imports/client/templates/Admin';
    import '/imports/client/templates/Indicators';
    import '/imports/client/templates/Home';
    import '/imports/client/templates/Wallet';
    import '/imports/client/templates/Balances';
    import '/imports/client/templates/Transactions';
    import '/imports/client/templates/Profile';
    import '/imports/client/templates/ListTalks';
    import '/imports/client/templates/Talk';
    import '/imports/client/templates/Trade';
    import '/imports/client/templates/Notifications';
    import '/imports/client/templates/News';
    import '/imports/client/templates/Otp';
    import '/imports/client/templates/PinCode';
    import '/imports/client/templates/Support';
    import '/imports/client/templates/About';
    import '/imports/client/templates/Terms';
    import '/imports/client/templates/Policy';
    import '/imports/client/templates/ReferralProgram';
    import '/imports/client/templates/UploadForm';
    
    // Jscrollpane
    import '/imports/client/lib/jquery.jscrollpane.min.js';
    import '/imports/client/lib/jquery.jmousewheel.js';
    
    // Password generation
    import '/imports/client/lib/passwordGeneration.js';
    
    // Promise
    import '/imports/client/lib/promise.min.js';
    
    // Symbol
    import '/imports/client/lib/symbol.min.js';
    
    // Tablesort
    import '/imports/client/lib/tablesort.js';
    
    // UserStatus
    import '/imports/client/userStatus.js';
    
    // Client routers
    import '/imports/client/routers';
    
    // Main js
    import '/imports/client/helpersLayout.js';
    import '/imports/client/notification.js';
});

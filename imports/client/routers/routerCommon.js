import logout from '/imports/client/logout.js';
import { Router, RouteController } from 'meteor/iron:router';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { profile, node } from '/imports/collections';
import { Session } from 'meteor/session';

window.ApplicationController = RouteController.extend({
    layoutTemplate: 'ApplicationLayout',
    onStop () {
        // register the previous route location in a session variable
        if (_.indexOf(['/otp', '/pincode', '/wallet', '/createwallet', '/unlockwallet', '/logout'], Router.current().route.path()) == -1) {
            Session.set('previousLocationPath', Router.current().route.path());
        }
    },
    waitOn () {
        if (Meteor.userId() === null) {
            return [];
        }
        return [
            Meteor.subscribe('Roles'),
            Meteor.subscribe('Profile'),
            Meteor.subscribe('Variable'),
        ];
    },
});

Router.configure({
    controller: 'ApplicationController',
    notFoundTemplate: 'NotFoundPage',
    noRoutesTemplate: 'NotFoundPage',
    loadingTemplate: 'spinner',
});

window.ClientAreaController = window.ApplicationController.extend({
    waitOn () {
        return [Meteor.subscribe('Roles'),
            Meteor.subscribe('Profile'),
            Meteor.subscribe('Variable'),
        ];
    },
    onBeforeAction () {
        if (_.isNull(Meteor.userId())) {
            Router.go('/wallet');
            return;
        }
        if (!Roles.userIsInRole(Meteor.userId(), ['client'])) {
            logout();
            Router.go('/wallet');
        } else {
            if (_.indexOf(['/otp'], Router.current().route.path()) == -1) {
                const currentUser = Meteor.users.findOne({ _id: Meteor.userId() });
                const currentProfile = profile.findOne({ UserId: Meteor.userId() });
                if (currentProfile && currentProfile.UseOTP) {
                    if (_.isUndefined(currentUser.onePassCode) || !currentUser.onePassCode.activated || currentUser.onePassCode.onLogin) {
                        Router.go('/otp');
                        return;
                    }
                }
            }

            if (_.isUndefined(Session.get('walletAddress')) && _.indexOf(['/wallet', '/support'], Router.current().route.path()) == -1) {
                Router.go('/wallet');
                return;
            }
            this.next();
        }
    },
});

Router.route('/', function() {
    if (this.ready()) {
        this.render('Home');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Home',
    name: 'Home',
    controller: 'ApplicationController',
});

Router.route('/news', function() {
    if (this.ready()) {
        this.render('News');
    } else {
        this.render('spinner');
    }
}, {
    title: 'News',
    name: 'News',
    controller: 'ApplicationController',
    data () {
        return { news: node.find({ type: 'news', instance: Session.get('currentLanguage') }) };
    },
    subscriptions () {
        return [Meteor.subscribe('News', Session.get('currentLanguage'))];
    },
});

Router.route('/support', function() {
    if (this.ready()) {
        this.render('Support');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Support',
    name: 'Support',
    controller: 'ApplicationController',
    data () {
        if (Meteor.userId()) {
            return profile.findOne({ UserId: Meteor.userId() });
        }
        return [];
    },
});

Router.route('/about', function() {
    if (this.ready()) {
        this.render('About');
    } else {
        this.render('spinner');
    }
}, {
    title: 'About service',
    name: 'About',
    controller: 'ApplicationController',
    data () {
        return {
            about: node.findOne({ type: 'about', instance: Session.get('currentLanguage') }),
            faqlist: node.find({ type: 'faq', instance: Session.get('currentLanguage') }),
        };
    },
    subscriptions () {
        return [Meteor.subscribe('About', Session.get('currentLanguage')),
            Meteor.subscribe('Faq', Session.get('currentLanguage'))];
    },
});

Router.route('/terms', function() {
    if (this.ready()) {
        this.render('Terms');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Terms of service',
    name: 'Terms',
    data () {
        return node.findOne({ type: 'terms', instance: Session.get('currentLanguage') });
    },
    subscriptions () {
        return [Meteor.subscribe('Terms', Session.get('currentLanguage'))];
    },
});

Router.route('/policy', function() {
    if (this.ready()) {
        this.render('Policy');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Privacy Policy',
    name: 'Policy',
    data () {
        return node.findOne({ type: 'policy', instance: Session.get('currentLanguage') });
    },
    subscriptions () {
        return [Meteor.subscribe('Policy', Session.get('currentLanguage'))];
    },
});

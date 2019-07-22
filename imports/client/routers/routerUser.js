import Cookies from 'js-cookie';
import logout from '/imports/client/logout.js';
import { Router } from 'meteor/iron:router';
import { profile, notification_history } from '/imports/collections.js';
import { Roles } from 'meteor/alanning:roles';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Router.plugin('userIPWhitelist', {
    template: 'PinCode',
    opts: {
        title: 'Pin code',
        name: 'PinCode',
        layoutTemplate: 'ApplicationLayout',
        onBeforeAction () {
            if (Meteor.userId() === null) {
                Router.go('/wallet');
                return;
            }
            this.next();
        },
    },
});

Router.route('/profile', function() {
    if (this.ready()) {
        this.render('Profile');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Profile',
    name: 'Profile',
    controller: 'ClientAreaController',
    data () {
        return profile.findOne({ UserId: Meteor.userId() });
    },
    waitOn () {
        return Meteor.subscribe('ApiKey');
    },
});

Router.route('/balances', function() {
    if (this.ready()) {
        this.render('Balances');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Balances',
    name: 'Balances',
    controller: 'ClientAreaController',
    waitOn () {
        return [Meteor.subscribe('UserBalance'), Meteor.subscribe('AvailableProduct')];
    },
});

Router.route('/transactions', function() {
    if (this.ready()) {
        this.render('Transactions');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Transactions',
    name: 'Transactions',
    controller: 'ClientAreaController',
    waitOn () {
        return Meteor.subscribe('UserTransactions', Session.get('MyTransactionsPage') ? Session.get('MyTransactionsPage') : 0);
    },
});

Router.route('/notifications', function() {
    if (this.ready()) {
        this.render('Notifications');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Notifications',
    name: 'Notifications',
    controller: 'ClientAreaController',
    data () {
        return {
            notifications: notification_history.find({ UserId: Meteor.userId() }, { sort: { CreatedAt: -1 } }),
        };
    },
    waitOn () {
        return Meteor.subscribe('Notification');
    },
});

Router.route('/otp', function() {
    if (this.ready()) {
        this.render('Otp');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Otp',
    name: 'otp',
    controller: 'ClientAreaController',
    onBeforeAction () {
        if (Meteor.userId() === null) {
            Router.go('/wallet');
            return;
        }
        if (!Roles.userIsInRole(Meteor.userId(), ['client'])) {
            logout();
            Router.go('/wallet');
        } else {
            this.next();
        }
    },
});

Router.map(function() {
    this.route('Logout', {
        title: 'Logout',
        path: '/logout',
        onBeforeAction () {
            logout();
        },
    });
    return null;
});

Router.map(function () {
    this.route('ReferralEntry', {
        title: 'Referral entry',
        path: '/ref/:_affiliateid',
        controller: 'ApplicationController',
        onBeforeAction () {
            Session.setPersistent('AffiliateId', this.params._affiliateid);
            Cookies.set('AffiliateId', this.params._affiliateid, { expires: 365 });
            Router.go('/');
        },
    });
    return null;
});

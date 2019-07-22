import { Router } from 'meteor/iron:router';

Router.route('/wallet', function() {
    if (this.ready()) {
        this.render('Wallet');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Wallet',
    name: 'Wallet',
    controller: 'ApplicationController',
});

Router.route('/createwallet', function() {
    if (this.ready()) {
        this.render('CreateWallet');
    } else {
        this.render('spinner');
    }
}, {
    title: 'CreateWallet',
    name: 'CreateWallet',
    controller: 'ApplicationController',
});

Router.route('/unlockwallet', function() {
    if (this.ready()) {
        this.render('UnlockWallet');
    } else {
        this.render('spinner');
    }
}, {
    title: 'UnlockWallet',
    name: 'UnlockWallet',
    controller: 'ApplicationController',
});

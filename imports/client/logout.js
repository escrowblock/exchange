import { Router } from 'meteor/iron:router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

const logout = () => {
    Meteor.logout(function() {
        // clear all secure sessions
        Session.clear('v3json');
        Session.clear('personalWalletCreated');
        Session.clear('walletAddress');
        Session.clear('personalWallet');
        Session.clearTemp();
        if (window.web3_previous) {
            window.web3 = window.web3_previous;
        }
        // redirect after logout
        Router.go('/trade');
    });
};

export { logout as default };

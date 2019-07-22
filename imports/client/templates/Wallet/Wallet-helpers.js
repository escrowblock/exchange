import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.Wallet.helpers({
    url: () => Meteor.absoluteUrl(),
});

Template.CreateWallet.helpers({
    print: () => !Meteor.isCordova,
    createWallet: () => !Session.get('personalWallet'),
});

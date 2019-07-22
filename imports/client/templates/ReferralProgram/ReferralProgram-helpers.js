import { TAPi18n } from 'meteor/tap:i18n';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

Template.ReferralProgram.helpers({
    selected: item => (Session.get('itemSelect') == item ? 'selected' : ''),
    bodySignature: () => TAPi18n.__('The Bitcointalk signature %s', `${Meteor.absoluteUrl()}ref/${Meteor.userId()}`),
});

import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.Otp.helpers({
    codeChecked() {
        return Meteor.userId() && Meteor.user().onePassCode.activated;
    },
});

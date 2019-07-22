import { modalAlert } from '/imports/modal';
import { TAPi18n } from 'meteor/tap:i18n';
import { Router } from 'meteor/iron:router';
import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.PinCode.events({
    'click #sendPinCode': (event, templateInstance) => {
        Meteor.call('checkPinCode', $(templateInstance.find('#pinCode')).val(), (error) => {
            if (error) {
                modalAlert(TAPi18n.__('Oops'), error.error);
            } else {
                Router.go('/profile');
            }
        });
        return false;
    },
});

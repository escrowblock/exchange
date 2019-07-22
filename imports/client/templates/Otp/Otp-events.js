import { modalAlert } from '/imports/modal';
import { TAPi18n } from 'meteor/tap:i18n';
import { Router } from 'meteor/iron:router';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.Otp.events({
    'click #checkOTPVerification': (event, templateInstance) => {
        if (!templateInstance.find('#codeOTPVerification').value) {
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('OTP code cannot be empty'));
            return false;
        }
        Meteor.call('checkOTP', templateInstance.find('#codeOTPVerification').value, function(error, result) {
            if (error) {
                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                return;
            }
            if (result) {
                Router.go('/profile');
            } else {
                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('OTP code is incorrect!'));
            }
        });
        return false;
    },
    'click #checkOTP': (event, templateInstance) => {
        if (!templateInstance.find('#codeOTP').value) {
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('OTP code cannot be empty'));
            return false;
        }
        Meteor.call('checkOTP', templateInstance.find('#codeOTP').value, true, function(error, result) {
            if (error) {
                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                return;
            }
            if (result) {
                Meteor.call('activeOTP', function(error) {
                    if (error) {
                        modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                        return;
                    }
                    modalAlert(TAPi18n.__('Success'), TAPi18n.__('All changes are saved'), 2000);
                    setTimeout(function() {
                        Router.go('/profile');
                    }, 4000);
                });
            } else {
                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('OTP code is incorrect!'));
            }
        });
        return false;
    },
});

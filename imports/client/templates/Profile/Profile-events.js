import { modalAlert, modalConfirmation, modalConfirmationOTP } from '/imports/modal';
import { profile } from '/imports/collections';
import { TAPi18n } from 'meteor/tap:i18n';
import { $ } from 'meteor/jquery';
import { AutoForm } from 'meteor/aldeed:autoform';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.Profile.events({
    'click #attachFile'() {
        $('#fileInput')[0].click();
        return false;
    },
    'touchend #attachFile'() {
        $('#fileInput')[0].click();
        return false;
    },
    'touchmove #attachFile'() {
        $('#fileInput')[0].click();
        return false;
    },
    'click #saveProfile'(event, templateInstance) {
        event.preventDefault();

        if (!AutoForm.validateForm('Profile')) {
            return false;
        }

        $('#profileForm').addClass('loading');
        $('#saveProfile').attr('disabled', 'disabled');
    
        const doc = AutoForm.getFormValues('Profile', templateInstance);

        if (profile.findOne({ UserId: Meteor.userId() }).UseOTP == true && doc.updateDoc.$set.UseOTP == false) {
            modalConfirmationOTP(function(error) {
                if (error) {
                    $('#saveProfile').removeAttr('disabled');
                    $('#profileForm').removeClass('loading');
                    modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                    return false;
                }
                Meteor.call('updateProfile', doc, function (error) {
                    $('#saveProfile').removeAttr('disabled');
                    $('#profileForm').removeClass('loading');
          
                    if (error) {
                        modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                        return;
                    }
                    modalAlert(TAPi18n.__('Success'), TAPi18n.__('All changes are saved'), 2000);
                });
                return null;
            });
        } else {
            Meteor.call('updateProfile', doc, function (error) {
                $('#saveProfile').removeAttr('disabled');
                $('#profileForm').removeClass('loading');
        
                if (error) {
                    modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                    return;
                }
                modalAlert(TAPi18n.__('Success'), TAPi18n.__('All changes are saved'), 2000);
            });
        }
    
        return false;
    },
    'click #generateNewKey'(event) {
        event.preventDefault();
        modalConfirmation(TAPi18n.__('Warning!'), TAPi18n.__('The current key will not be useful after the moment when new will be generated.'),
            function() {
            },
            function() {
                $('#apiKeyForm').addClass('loading');
                if (profile.findOne({ UserId: Meteor.userId() }).UseOTP == true) {
                    modalConfirmationOTP(function(error) {
                        if (error) {
                            $('#apiKeyForm').removeClass('loading');
                            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                            return false;
                        }
                        Meteor.call('generateNewApiKey', function (error) {
                            $('#apiKeyForm').removeClass('loading');
                            if (error) {
                                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                                return;
                            }
                            modalAlert(TAPi18n.__('Success'), TAPi18n.__('New key is generated.'), 2000);
                        });
                        return null;
                    });
                } else {
                    Meteor.call('generateNewApiKey', function (error) {
                        $('#apiKeyForm').removeClass('loading');
                        if (error) {
                            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                            return;
                        }
                        modalAlert(TAPi18n.__('Success'), TAPi18n.__('New key is generated.'), 2000);
                    });
                }
                return null;
            });

        return false;
    },
    'click #copyKey': (event, templateInstance) => {
        const copyText = templateInstance.find('#APIKey');
        copyText.select();
        document.execCommand('copy');
        modalAlert(TAPi18n.__('Copied!'), '', 1000);
        return false;
    },
    'click #copySecret': (event, templateInstance) => {
        const copyText = templateInstance.find('#APISecret');
        copyText.select();
        document.execCommand('copy');
        modalAlert(TAPi18n.__('Copied!'), '', 1000);
        return false;
    },
});

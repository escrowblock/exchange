import { modalAlert } from '/imports/modal';
import { $ } from 'meteor/jquery';
import { AutoForm } from 'meteor/aldeed:autoform';
import { TAPi18n } from 'meteor/tap:i18n';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.Support.events({
    'click a.external': (event) => {
        if (Meteor.isCordova) {
            window.open($(event.currentTarget).attr('href'), '_system');
        } else {
            window.location = $(event.currentTarget).attr('href');
        }
    },
    'click #sendMessage' (event, templateInstance) {
        if (!AutoForm.validateForm('support')) {
            return false;
        }
        const _elem = $('#supportForm');
        _elem.addClass('loading');
        $('#sendMessage').attr('disabled', 'disabled');
    
        const doc = AutoForm.getFormValues('support', templateInstance);

        Meteor.call('sendSupport', doc, function(error, result) {
            _elem.removeClass('loading');
            $('#sendMessage').removeAttr('disabled');
            if (error) {
                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                return;
            }

            if (result) {
                modalAlert(TAPi18n.__('We have got your message'));
            }
        });
        return false;
    },
});

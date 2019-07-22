import logout from '/imports/client/logout.js';
import { modalAlert } from '/imports/modal';
import { $ } from 'meteor/jquery';
import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { Showdown } from 'meteor/markdown';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.ApplicationLayout.events({
    'click a.external': (event) => {
        if (Meteor.isCordova) {
            window.open($(event.currentTarget).attr('href'), '_system');
        } else {
            window.location = $(event.currentTarget).attr('href');
        }
        return false;
    },
    'click #logout': (event) => {
        $(event.currentTarget).attr('disabled', 'disabled').addClass('loading');
        logout();
        return false;
    },
    'click .tutorial': (event) => {
        const source = $(event.target).attr('data');
        if (source) {
            Meteor.call('getTutorial', source, Session.get('currentLanguage'), function(error, tutorial) {
                if (error) {
                    modalAlert(TAPi18n.__('Oops, something happened'), error.message);
                    return false;
                }
                if (_.isUndefined(tutorial)) {
                    // modalAlert(TAPi18n.__("Oops, something happened"), TAPi18n.__("Unknown tutorial"));
                    return false;
                }
                const converter = new Showdown.converter();
                modalAlert(tutorial.Title, converter.makeHtml(tutorial.Body));
                return null;
            });
        }
        return false;
    },
});

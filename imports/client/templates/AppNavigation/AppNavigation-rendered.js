import { $ } from 'meteor/jquery';
import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { moment } from 'meteor/momentjs:moment';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.AppNavigation.onRendered(function () {
    const lang = Meteor.userId() && !_.isUndefined(Meteor.user()) && Meteor.user().profile ? Meteor.user().profile.language : TAPi18n.getLanguage();

    $('.menu .ui.dropdown').dropdown('set selected', lang);

    // show dropdown on hover
    $('.menu .ui.dropdown').dropdown({
        on: 'hover',
        transition: 'swing down',
        onChange(value, text, $choice) {
            if ($choice.attr('data-type') == 'lang') {
                TAPi18n.setLanguage(value)
                    .done(function () {
                        if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
                            console.log(`Language was set in ${value}`);
                        }
                        Session.set('currentLanguage', value);
                        if (Meteor.userId()) {
                            Meteor.call('updateLanguage', value);
                        }
                        moment.locale(value);
                    })
                    .fail(function (error_message) {
                        // Handle the situation
                        console.log(error_message);
                    });
            }
        },
    });
});

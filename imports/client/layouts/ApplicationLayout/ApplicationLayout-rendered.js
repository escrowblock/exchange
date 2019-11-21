import { moment } from 'meteor/momentjs:moment';
import { $ } from 'meteor/jquery';
import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { loadWeb3 } from '/imports/client/blockchain';

Template.ApplicationLayout.onRendered(function() {
    // We should enable hot code push only for dev-env
    window.Reload._onMigrate(function() {
        return [!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug];
    });
    
    // create sidebar and attach to menu open
    $('.ui.sidebar')
        .sidebar('attach events', '.toc.item');

    $('.tooltip-help').popup();

    $(window).on('resize', function() {
        Session.set('windowWidth', $(window).width());
    });
    Session.set('windowWidth', $(window).width());

    // show dropdown on hover
    $('.menu .ui.dropdown').dropdown({
        on: 'hover',
        transition: 'swing down',
        onChange(value, text, $choice) {
            if ($choice.attr('data-type') == 'lang') {
                TAPi18n.setLanguage(value)
                    .done(function () {
                        console.log(`Language was set in ${value}`);
                        Session.set('currentLanguage', value);
                        $('#at-field-language').val(value);
                        moment.locale(value);
                    })
                    .fail(function (error_message) {
                        // Handle the situation
                        console.log(error_message);
                    });
            }
        },
    });

    const lang = !_.isUndefined(Session.get('currentLanguage')) ? Session.get('currentLanguage') : TAPi18n.getLanguage();

    $('.menu .ui.dropdown').dropdown('set selected', lang);
    
    loadWeb3();
});

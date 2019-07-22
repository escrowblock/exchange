import logout from '/imports/client/logout.js';
import { $ } from 'meteor/jquery';
import { TAPi18n } from 'meteor/tap:i18n';
import { Router } from 'meteor/iron:router';
import { _ } from 'meteor/underscore';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.ApplicationLayout.onCreated(function() {
    const template = this;
  
    template.tracker = Tracker.autorun(function() {
        Session.get('currentLanguage');
        if (Router.current().route.options) {
            $('title').text(TAPi18n.__(Router.current().route.options.title));
        }
        document.title = TAPi18n.__('TITLE_PAGE');
    });
  
    template.tracker1 = Tracker.autorun(function() {
        if (Session.get('themeMode') == 'moon') {
            $('body').addClass('dark');
        } else {
            $('body').removeClass('dark');
        }
    });
  
    template.cacheIdenticon = {};
  
    template.tracker2 = Tracker.autorun(function() {
        const _user = Meteor.user();
        if (_user) {
            template.userLogged = true;
        } else if (!_.isUndefined(template.userLogged) && template.userLogged == true) {
            logout();
        }
    });
});

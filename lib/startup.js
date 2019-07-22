import { _ } from 'meteor/underscore';
import { Push } from 'meteor/raix:push';
import { Meteor } from 'meteor/meteor';

// code to run on server at startup
Meteor.startup(function () {
    if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
        Push.debug = true;
    }
});

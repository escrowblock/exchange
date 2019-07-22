import { talk } from '/imports/collections';
import { _ } from 'meteor/underscore';
import { Router } from 'meteor/iron:router';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

Template.ListTalks.onCreated(function() {
    const template = this;
    template.decryptedMessage = new ReactiveVar(null);
    template.tracker = Tracker.autorun(function(computation) {
        if (_.isUndefined(talk.findOne())) {
            computation.stop();
            Router.go('/trade');
        }
    });
});

Template.ListTalksItem.onCreated(function() {
    const template = this;
    template.cacheIdenticon = {};
});

import { Router } from 'meteor/iron:router';
import { talk } from '/imports/collections';
import { _ } from 'meteor/underscore';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';

Template.Talk.onCreated(function() {
    const template = this;
    template.decryptedMessages = new ReactiveDict();
    template.cacheIdenticon = {};
    template.maxCounter = 1000;
  
    template.tracker = Tracker.autorun(function(computation) {
        if (_.isUndefined(talk.findOne())) {
            computation.stop();
            Router.go('/trade');
        }
    });
});

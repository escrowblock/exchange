import { notification_history, variable, node } from '/imports/collections';
import { _ } from 'meteor/underscore';
import { Counter } from 'meteor/natestrauser:publish-performant-counts';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

Meteor.publish('Roles', function () {
    return Meteor.roles.find({});
});

Meteor.publish('Notification', function () {
    return notification_history.find({ UserId: this.userId, MarkedAsRead: false });
});

Meteor.publish('NotificationBadge', function() {
    if (this.userId) {
        const counters = [];
        counters.push(new Counter('NotificationBadge', notification_history.find({ UserId: this.userId, MarkedAsRead: false }), 3000));
        return counters;
    }
    this.ready();
    return null;
});

Meteor.publish('Variable', function (instance) {
    const _params = { security: false };
    check(instance, Match.Maybe(String));
    if (!_.isEmpty(instance)) {
        _params.$or = [{ instance }, { instance: { $exists: false } }];
    }
    return variable.find(_params);
});

Meteor.publish('Terms', function(instance) {
    const _params = { type: 'terms' };
    check(instance, Match.Maybe(String));
    if (!_.isEmpty(instance)) {
        _params.$or = [{ instance }, { instance: { $exists: false } }];
    }
    return node.find(_params);
});

Meteor.publish('Policy', function(instance) {
    const _params = { type: 'policy' };
    check(instance, Match.Maybe(String));
    if (!_.isEmpty(instance)) {
        _params.$or = [{ instance }, { instance: { $exists: false } }];
    }
    return node.find(_params);
});

Meteor.publish('News', function(instance) {
    const _params = { type: 'news' };
    check(instance, Match.Maybe(String));
    if (!_.isEmpty(instance)) {
        _params.$or = [{ instance }, { instance: { $exists: false } }];
    }
    return node.find(_params);
});

Meteor.publish('About', function(instance) {
    const _params = { type: 'about' };
    check(instance, Match.Maybe(String));
    if (!_.isEmpty(instance)) {
        _params.$or = [{ instance }, { instance: { $exists: false } }];
    }
    return node.find(_params);
});

Meteor.publish('Faq', function(instance) {
    const _params = { type: 'faq' };
    check(instance, Match.Maybe(String));
    if (!_.isEmpty(instance)) {
        _params.$or = [{ instance }, { instance: { $exists: false } }];
    }
    return node.find(_params);
});

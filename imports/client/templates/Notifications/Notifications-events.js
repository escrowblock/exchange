import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.Notifications.events({
    'click .js-mark-notification'() {
        Meteor.call('markAllNotificationsAsRead');
        return false;
    },
});

Template.NotificationItem.events({
    'click a.external': (event) => {
        if (Meteor.isCordova) {
            window.open($(event.currentTarget).attr('href'), '_system');
        } else {
            window.location = $(event.currentTarget).attr('href');
        }
        return false;
    },
    'click .unread'(event) {
        Meteor.call('markNotificationAsRead', $(event.currentTarget).attr('data-id'));
        return false;
    },
    'click .js-mark-one-notification'(event) {
        Meteor.call('markNotificationAsRead', $(event.currentTarget).attr('data-id'));
        return false;
    },
});

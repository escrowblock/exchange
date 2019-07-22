import { moment } from 'meteor/momentjs:moment';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

Template.Notifications.helpers({
    notEmpty() {
        return this.notifications.count();
    },
});

Template.NotificationItem.helpers({
    date() {
        return moment(this.CreatedAt).format('Do MMM YYYY hh:mm A');
    },
    notificationFrom() {
        return ('from' in this && this.From) ? this.From : 'Administrator';
    },
    link() {
        return !_.isUndefined(this.Path) ? this.Path : '';
    },
    markAsRead() {
        return this.MarkedAsRead ? '' : 'unread';
    },
});

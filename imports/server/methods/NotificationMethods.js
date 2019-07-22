import { notification_history } from '/imports/collections';
import { Meteor } from 'meteor/meteor';

Meteor.methods({
    deleteNotification (id) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to delete');
        }
        notification_history.remove({ _id: id, UserId: Meteor.userId() });
    },
    markNotificationAsRead (id) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to mark one');
        }
        notification_history.update({ _id: id, UserId: Meteor.userId() }, { $set: { MarkedAsRead: true } });
    },
    markAllNotificationsAsRead () {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to mark all');
        }
        notification_history.update({ UserId: Meteor.userId() }, { $set: { MarkedAsRead: true } }, { multi: true });
    },
});

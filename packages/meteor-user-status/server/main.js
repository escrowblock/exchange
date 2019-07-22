import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

const NOOP = function() {};

Accounts.onLogin((data) => {
    // we don't need to track REST API call
    if (data.connection.id) {
        Meteor.users.update({
            _id: data.user._id,
        }, {
            $set: {
                connection: data.connection.id,
                'profile.online': true,
                'profile.idle': false,
                'profile.lastLogin': new Date(),
            },
        }, NOOP);
    }
});

Accounts.onLogout((user, connection) => {
    if (connection && connection.id) {
        Meteor.users.update({
            _id: user._id,
        }, {
            $set: {
                connection: connection.id,
                'profile.online': false,
                'profile.idle': false,
            },
        }, NOOP);
    }
});

Meteor.onConnection((connection) => {
    const connectionId = connection.id;

    connection.onClose(() => {
        Meteor.users.update({
            connection: connectionId,
        }, {
            $set: {
                'profile.online': false,
                'profile.idle': false,
            },
        }, NOOP);
    });
});

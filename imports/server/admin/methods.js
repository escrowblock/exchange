import { adminCollectionObject, adminCallback } from '/imports/admin/utils.js';
import { Roles } from 'meteor/alanning:roles';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.methods({
    adminInsertDoc(doc, collection) {
        check(doc, Object);
        check(collection, String);
        if (Roles.userIsInRole(this.userId, ['admin'])) {
            this.unblock();
            return adminCollectionObject(collection).insert(doc);
        }
        return null;
    },
    adminUpdateDoc(modifier, collection, _id) {
        check(modifier, Object);
        check(collection, String);
        check(_id, String);
        if (Roles.userIsInRole(this.userId, ['admin'])) {
            this.unblock();
            return adminCollectionObject(collection).update({ _id }, modifier);
        }
        return null;
    },
    adminRemoveDoc(collection, _id) {
        check(collection, String);
        check(_id, String);
        if (Roles.userIsInRole(this.userId, ['admin'])) {
            if (collection === 'Users') {
                adminCallback('onDeleteUser', [_id]);
                return Meteor.users.remove({
                    _id,
                });
            }
            return adminCollectionObject(collection).remove({
                _id,
            });
        }
        return null;
    },
    adminAddUserToRole(_id, role) {
        check(_id, String);
        check(role, String);
        if (Roles.userIsInRole(this.userId, ['admin'])) {
            return Roles.addUsersToRoles(_id, role, Roles.GLOBAL_GROUP);
        }
        return null;
    },
    adminRemoveUserToRole(_id, role) {
        check(_id, String);
        check(role, String);
        if (Roles.userIsInRole(this.userId, ['admin'])) {
            return Roles.removeUsersFromRoles(_id, role, Roles.GLOBAL_GROUP);
        }
        return null;
    },
    adminSetCollectionSort(collection, _sort) {
        check(collection, String);
        check(_sort, Object);
        return global.AdminPages[collection].set({
            sort: _sort,
        });
    },
});

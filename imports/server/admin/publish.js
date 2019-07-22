import { adminCollectionObject, adminTablePubName, AdminTables } from '/imports/admin/utils';
import AdminConfig from '/imports/admin/config';
import { Roles } from 'meteor/alanning:roles';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';

const adminPublishTables = function(collections) {
    return _.each(collections, function(collection, name) {
        if (!collection.children) {
            return false;
        }
        return Meteor.publishComposite(adminTablePubName(name), function(tableName, ids, fields) {
            check(tableName, String);
            check(ids, Array);
            check(fields, Match.Optional(Object));
            const extraFields = _.reduce(collection.extraFields, function(fieldsArg, name) {
                const fields = fieldsArg;
                fields[name] = 1;
                return fields;
            }, {});
            _.extend(fields, extraFields);
            this.unblock();
            return {
                find() {
                    this.unblock();
                    return adminCollectionObject(name).find({
                        _id: {
                            $in: ids,
                        },
                    }, {
                        fields,
                    });
                },
                children: collection.children,
            };
        });
    });
};

adminPublishTables(typeof AdminConfig !== 'undefined' && AdminConfig !== null ? AdminConfig.collections : false);

Meteor.publishComposite('adminCollectionDoc', function(collection, id) {
    check(collection, String);
    check(id, Match.OneOf(String, Mongo.ObjectID));
    if (Roles.userIsInRole(this.userId, ['admin'])) {
        return {
            find() {
                return adminCollectionObject(collection).find(id);
            },
            children: (!_.isUndefined(AdminConfig) && AdminConfig !== null && AdminConfig.collections != null && AdminConfig.collections[collection] != null ? AdminConfig.collections[collection].children : undefined) || [],
        };
    }
    return this.ready();
});

Meteor.publish('adminUsers', function() {
    if (Roles.userIsInRole(this.userId, ['admin'])) {
        return Meteor.users.find();
    }
    return this.ready();
});

Meteor.publish('adminUser', function() {
    return Meteor.users.find(this.userId);
});

Meteor.publish('adminCollectionsCount', function() {
    const handles = [];
    const hookHandles = [];
    const self = this;
    _.each(AdminTables, function(table, name) {
        let count; let docCollection;
        const id = new Mongo.ObjectID();
        // @TODO
        if (name == 'Users') {
            docCollection = Meteor.users;
        } else {
            docCollection = adminCollectionObject(name);
        }
        count = docCollection.find().count();
        self.added('adminCollectionsCount', id, {
            collection: name,
            count,
        });
        const update = function() {
            return self.changed('adminCollectionsCount', id, {
                count,
            });
        };
        hookHandles.push(docCollection.after.insert(function() {
            count += 1;
            return update();
        }));
        return hookHandles.push(docCollection.after.remove(function() {
            count -= 1;
            return update();
        }));
    });
    self.onStop(function() {
        _.each(handles, function(handle) {
            return handle.stop();
        });
        return _.each(hookHandles, function(handle) {
            return handle.remove();
        });
    });
    return self.ready();
});

Meteor.publish('roles', function() {
    return Meteor.roles.find({});
});

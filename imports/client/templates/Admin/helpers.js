import { AdminDashboard, AdminTables } from '/imports/admin/utils';
import AdminConfig from '/imports/admin/config';
import { Roles } from 'meteor/alanning:roles';
import { _ } from 'meteor/underscore';
import { Router } from 'meteor/iron:router';
import { AdminCollectionsCount } from '/imports/collections';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.registerHelper('AdminTables', AdminTables);

const adminCollections = function() {
    let collections;
    collections = {};
    if (!_.isUndefined(AdminConfig) && _.isObject(AdminConfig.collections)) {
        ({ collections } = AdminConfig);
    }
    collections.Users = {
        collectionObject: Meteor.users,
        icon: 'users',
        label: 'Users',
    };
    return _.map(collections, function(objArg, key) {
        let obj = objArg;
        obj = _.extend(obj, {
            name: key,
        });
        obj = _.defaults(obj, {
            label: key,
            icon: 'plus',
            color: 'blue',
        });
        obj = _.extend(obj, {
            viewPath: Router.path(`adminDashboard${key}View`),
            newPath: Router.path(`adminDashboard${key}New`),
        });
        return obj;
    });
};

Template.registerHelper('AdminConfig', function() {
    if (!_.isUndefined(AdminConfig)) {
        return AdminConfig;
    }
    return null;
});

Template.registerHelper('admin_skin', function() {
    return (!_.isUndefined(AdminConfig) && AdminConfig !== null ? AdminConfig.skin : null) || 'blue';
});

Template.registerHelper('admin_collections', adminCollections);

Template.registerHelper('admin_collection_name', function() {
    return Session.get('admin_collection_name');
});

Template.registerHelper('admin_current_id', function() {
    return Session.get('admin_id');
});

Template.registerHelper('isActivePath', function(object) {
    return Router.current().route.getName() == object.path ? 'activeClass' : 'disabledClass';
});

Template.registerHelper('admin_current_doc', function() {
    return Session.get('admin_doc');
});

Template.registerHelper('admin_is_users_collection', function() {
    return Session.get('admin_collection_name') === 'Users';
});

Template.registerHelper('admin_sidebar_items', function() {
    return AdminDashboard.sidebarItems;
});

Template.registerHelper('admin_collection_items', function() {
    const items = [];
    _.each(AdminDashboard.collectionItems, (function(_this) {
        return function(fn) {
            const item = fn(_this.name, `/${_this.name}`);
            if ((item != null ? item.title : null) && (item != null ? item.url : null)) {
                return items.push(item);
            }
            return null;
        };
    }(this)));
    return items;
});

Template.registerHelper('admin_omit_fields', function() {
    let collection; let
        global;
    if (!_.isUndefined(AdminConfig.autoForm) && typeof AdminConfig.autoForm.omitFields === 'object') {
        global = AdminConfig.autoForm.omitFields;
    }
    if (!Session.equals('admin_collection_name', 'Users') && !_.isUndefined(AdminConfig) && typeof AdminConfig.collections[Session.get('admin_collection_name')].omitFields === 'object') {
        collection = AdminConfig.collections[Session.get('admin_collection_name')].omitFields;
    }
    if (typeof global === 'object' && typeof collection === 'object') {
        return _.union(global, collection);
    } if (typeof global === 'object') {
        return global;
    } if (typeof collection === 'object') {
        return collection;
    }
    return null;
});

Template.registerHelper('AdminSchemas', function() {
    return AdminDashboard.schemas;
});

Template.registerHelper('adminGetSkin', function() {
    if (!_.isUndefined(AdminConfig.dashboard) && typeof AdminConfig.dashboard.skin === 'string') {
        return AdminConfig.dashboard.skin;
    }
    return 'blue';
});

Template.registerHelper('adminIsUserInRole', function(_id, role) {
    return Roles.userIsInRole(_id, role);
});

Template.registerHelper('adminGetUsers', function() {
    return Meteor.users;
});

Template.registerHelper('adminGetUserSchema', function() {
    let schema;
    if (_.has(AdminConfig, 'userSchema')) {
        schema = AdminConfig.userSchema;
    } else if (typeof Meteor.users._c2 === 'object') {
        schema = Meteor.users.simpleSchema();
    }
    return schema;
});

Template.registerHelper('adminCollectionLabel', function(collection) {
    if (collection != null) {
        return AdminDashboard.collectionLabel(collection);
    }
    return null;
});

Template.registerHelper('adminCollectionCount', function(collection) {
    if (collection === 'Users') {
        return Meteor.users.find().count();
    }
    const ref = AdminCollectionsCount.findOne({ collection });
    return ref != null ? ref.count : null;
});

Template.registerHelper('adminTemplate', function(collection, mode) {
    if ((collection != null ? collection.toLowerCase() : null) !== 'users' && !_.isUndefined(!_.isUndefined(AdminConfig) && AdminConfig !== null && AdminConfig.collections != null && AdminConfig.collections[collection] != null ? AdminConfig.collections[collection].templates : undefined)) {
        return AdminConfig.collections[collection].templates[mode];
    }
    return null;
});

Template.registerHelper('adminGetCollection', function(collection) {
    return _.find(adminCollections(), function(item) {
        return item.name === collection;
    });
});

Template.registerHelper('adminWidgets', function() {
    if (typeof AdminConfig.dashboard !== 'undefined' && typeof AdminConfig.dashboard.widgets !== 'undefined') {
        return AdminConfig.dashboard.widgets;
    }
    return null;
});

/*

*/
Template.AdminDashboardUsersNew.helpers({
    optionsRoles: () => _.map(Roles.getAllRoles().fetch(), function(role) {
        return { label: role.name, value: role.name };
    }),
});

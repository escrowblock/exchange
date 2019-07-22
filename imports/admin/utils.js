import AdminConfig from '/imports/admin/config.js';
import { _ } from 'meteor/underscore';
import { Roles } from 'meteor/alanning:roles';
import { $ } from 'meteor/jquery';
import { Router } from 'meteor/iron:router';
import { Tabular } from 'meteor/aldeed:tabular';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import * as collections from '/imports/collections';

const adminCallback = function(name, args, callback) {
    let stop;
    stop = false;
    const ref1 = !_.isUndefined(AdminConfig) && AdminConfig !== null ? AdminConfig.callbacks : null;
    if (_.isFunction(ref1 != null ? ref1[name] : null)) {
        stop = ref1[name](...args) === false;
    }
    if (_.isFunction(callback)) {
        if (!stop) {
            return callback(...args);
        }
    }
    return false;
};

const lookup = function(obj, rootArg, requiredArg) {
    let arr; let
        ref;
    let required = false;
    let collections_case = false;
    let root = null;
    if (requiredArg == null) {
        required = true;
    }
    if (_.isUndefined(rootArg)) {
        root = collections;
        collections_case = true;
    } else {
        root = rootArg;
    }
    if (typeof obj === 'string') {
        ref = root;
        arr = obj.split('.');
        let test = arr.shift();
        ref = ref[test];
        while (arr.length && ref) {
            test = arr.shift();
            if (!ref[test]) {
                break;
            }
            ref = ref[test];
        }
        if (!ref && required) {
            if (collections_case) {
                lookup(obj, (Meteor.isClient ? window : global), requiredArg);
            } else {
                throw new Error(`${obj} is not in the ${_.isObject(root) ? 'collections' : root.toString()}`);
            }
        } else {
            return ref;
        }
    }
    return obj;
};

const adminCollectionObject = function(collection) {
    if (!_.isUndefined(AdminConfig.collections[collection]) && !_.isUndefined(AdminConfig.collections[collection].collectionObject)) {
        return AdminConfig.collections[collection].collectionObject;
    }
    return lookup(collection);
};

const parseID = function(id) {
    if (typeof id === 'string') {
        if (id.indexOf('ObjectID') > -1) {
            return new Mongo.ObjectID(id.slice(id.indexOf('"') + 1, id.lastIndexOf('"')));
        }
        return id;
    }
    return id;
};

const parseIDs = function(ids) {
    return _.map(ids, function(id) {
        return parseID(id);
    });
};

const AdminDashboard = {
    schemas: {},
    sidebarItems: [],
    collectionItems: [],
    alertSuccess(message) {
        return Session.set('adminSuccess', message);
    },
    alertFailure(message) {
        return Session.set('adminError', message);
    },
    checkAdmin() {
        if (!Roles.userIsInRole(Meteor.userId(), ['admin'])) {
            Meteor.call('adminCheckAdmin');
            if (typeof (typeof AdminConfig !== 'undefined' && AdminConfig !== null ? AdminConfig.nonAdminRedirectRoute : null) === 'string') {
                Router.go(AdminConfig.nonAdminRedirectRoute);
            }
        }
        if (_.isFunction(this.next)) {
            return this.next();
        }
        return null;
    },
    adminRoutes: ['adminDashboard', 'adminDashboardUsersNew', 'adminDashboardUsersEdit', 'adminDashboardView', 'adminDashboardNew', 'adminDashboardEdit'],
    collectionLabel(collection) {
        if (collection === 'Users') {
            return 'Users';
        } if ((collection != null) && typeof AdminConfig.collections[collection].label === 'string') {
            return AdminConfig.collections[collection].label;
        }
        return Session.get('admin_collection_name');
    },
    addSidebarItem(title, url, options) {
        const item = {
            title,
        };
        if (_.isObject(url) && _.isUndefined(options)) {
            item.options = url;
        } else {
            item.url = url;
            item.options = options;
        }
        return this.sidebarItems.push(item);
    },
    extendSidebarItem(title, urlsArg) {
        let urls = urlsArg;
        if (_.isObject(urls)) {
            urls = [urls];
        }
        const existing = _.find(this.sidebarItems, function(item) {
            return item.title === title;
        });
        if (existing) {
            existing.options.urls = _.union(existing.options.urls, urls);
            return existing.options.urls;
        }
        return false;
    },
    addCollectionItem(fn) {
        return this.collectionItems.push(fn);
    },
    path(s) {
        let path;
        path = '/admin/';
        if (typeof s === 'string' && s.length > 0) {
            path += (s[0] === '/' ? '' : '/') + s;
        }
        return path;
    },
};

const AdminTables = {};

const adminTablePubName = function(collection) {
    return `admin_tabular_${collection}`;
};

const adminTablesDom = '<"box"<"box-header"<"box-toolbar"<"pull-left"<lf>><"pull-right"p>>><"box-body"t>><r>';

const adminEditButton = {
    data: '_id',
    title: 'Edit',
    createdCell(node, cellData) {
        return $(node).html(Blaze.toHTMLWithData(Template.adminEditBtn, {
            _id: cellData,
        }));
    },
    width: '40px',
    orderable: false,
};

const adminDelButton = {
    data: '_id',
    title: 'Delete',
    createdCell(node, cellData) {
        return $(node).html(Blaze.toHTMLWithData(Template.adminDeleteBtn, {
            _id: cellData,
        }));
    },
    width: '40px',
    orderable: false,
};

const adminEditDelButtons = [adminEditButton, adminDelButton];

const defaultColumns = function() {
    return [
        {
            data: '_id',
            title: 'ID',
        },
    ];
};

const adminCreateTables = function(collections) {
    return _.each(collections, function(collection, name) {
        let columns;
        _.defaults(collection, {
            showEditColumn: true,
            showDelColumn: true,
            showInSideBar: true,
        });
        columns = _.map(collection.tableColumns, function(column) {
            let createdCell;
            if (column.template) {
                createdCell = function(node, cellData, rowData) {
                    $(node).html('');
                    return Blaze.renderWithData(Template[column.template], {
                        value: cellData,
                        label: column.label,
                        doc: rowData,
                    }, node);
                };
            }
            const obj = {
                data: column.name,
                title: column.label,
                createdCell,
                orderable: column.orderable,
            };
            if (column.render) {
                obj.render = column.render;
            }
            if (column.class) {
                obj.class = column.class;
            }
            return obj;
        });
        if (columns.length === 0) {
            columns = defaultColumns();
        }
        if (collection.showEditColumn) {
            columns.push(adminEditButton);
        }
        if (collection.showDelColumn) {
            columns.push(adminDelButton);
        }
        
        AdminTables[name] = new Tabular.Table({
            name,
            collection: adminCollectionObject(name),
            pub: collection.children && adminTablePubName(name),
            sub: collection.sub,
            columns,
            extraFields: collection.extraFields,
            dom: adminTablesDom,
            selector: collection.selector || function() {
                return {};
            },
        });
        return AdminTables[name];
    });
};

const adminCreateRouteViewOptions = function(collection, collectionName) {
    const options = {
        path: `${AdminConfig.homeUrl}/${collectionName}`,
        template: 'AdminDashboardViewWrapper',
        controller: 'AdminController',
        data() {
            return {
                admin_table: AdminTables[collectionName],
            };
        },
        action() {
            return this.render();
        },
        onAfterAction() {
            Session.set('admin_title', collectionName);
            Session.set('admin_subtitle', 'View');
            Session.set('admin_collection_name', collectionName);
            return collection.routes != null && collection.routes.view != null ? collection.routes.view.onAfterAction : false;
        },
    };
    return _.defaults(options, collection.routes != null ? collection.routes.view : false);
};

const adminCreateRouteView = function(collection, collectionName) {
    return Router.route(`adminDashboard${collectionName}View`, adminCreateRouteViewOptions(collection, collectionName));
};

const adminCreateRouteNewOptions = function(collection, collectionName) {
    const options = {
        path: `${AdminConfig.homeUrl}/${collectionName}/new`,
        template: 'AdminDashboardNew',
        controller: 'AdminController',
        action() {
            return this.render();
        },
        onAfterAction() {
            Session.set('admin_title', AdminDashboard.collectionLabel(collectionName));
            Session.set('admin_subtitle', 'Create new');
            Session.set('admin_collection_page', 'new');
            Session.set('admin_collection_name', collectionName);
            return collection.routes != null && collection.routes.new != null ? collection.routes.new.onAfterAction : false;
        },
        data() {
            return {
                admin_collection: adminCollectionObject(collectionName),
            };
        },
    };
    return _.defaults(options, collection.routes != null ? collection.routes.new : false);
};

const adminCreateRouteNew = function(collection, collectionName) {
    return Router.route(`adminDashboard${collectionName}New`, adminCreateRouteNewOptions(collection, collectionName));
};

const adminCreateRouteEditOptions = function(collection, collectionName) {
    const options = {
        path: `/admin/${collectionName}/:_id/edit`,
        template: 'AdminDashboardEdit',
        controller: 'AdminController',
        waitOn() {
            const handle = Meteor.subscribe('adminCollectionDoc', collectionName, parseID(this.params._id));
            const ref = collection.routes != null && collection.routes.edit != null && collection.routes.waitOn != null ? collection.routes.waitOn() : null;
            const handles = ref != null ? ref : [];
            return _.union([handle], handles);
        },
        action() {
            return this.render();
        },
        onAfterAction() {
            Session.set('admin_title', AdminDashboard.collectionLabel(collectionName));
            Session.set('admin_subtitle', `Edit ${this.params._id}`);
            Session.set('admin_collection_page', 'edit');
            Session.set('admin_collection_name', collectionName);
            Session.set('admin_id', parseID(this.params._id));
            Session.set('admin_doc', adminCollectionObject(collectionName).findOne({
                _id: parseID(this.params._id),
            }));
            return collection.routes != null && collection.routes.edit != null && collection.routes.onAfterAction != null ? collection.routes.onAfterAction() : null;
        },
        data() {
            return {
                admin_collection: adminCollectionObject(collectionName),
            };
        },
    };
    return _.defaults(options, collection.routes != null ? collection.routes.edit : null);
};

const adminCreateRouteEdit = function(collection, collectionName) {
    return Router.route(`adminDashboard${collectionName}Edit`, adminCreateRouteEditOptions(collection, collectionName));
};

const adminCreateRoutes = function(collections) {
    _.each(collections, adminCreateRouteView);
    _.each(collections, adminCreateRouteNew);
    return _.each(collections, adminCreateRouteEdit);
};

AdminTables.Users = new Tabular.Table({
    name: 'Users',
    collection: Meteor.users,
    columns: _.union([
        {
            data: '_id',
            title: 'Admin',
            createdCell(node, cellData) {
                return $(node).html(Blaze.toHTMLWithData(Template.adminUsersIsAdmin, {
                    _id: cellData,
                }));
            },
            width: '40px',
        },
        {
            data: 'createdAt',
            title: 'Joined',
        },
    ], adminEditDelButtons),
    dom: adminTablesDom,
});

adminCreateRoutes(!_.isUndefined(AdminConfig) && AdminConfig !== null ? AdminConfig.collections : false);
adminCreateTables(!_.isUndefined(AdminConfig) && AdminConfig !== null ? AdminConfig.collections : false);

export {
    adminCollectionObject, adminCallback, lookup, parseID, parseIDs, AdminDashboard, AdminTables, adminTablePubName,
};

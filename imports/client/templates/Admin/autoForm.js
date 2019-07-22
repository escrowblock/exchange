import { AutoForm } from 'meteor/aldeed:autoform';
import { Router } from 'meteor/iron:router';
import { $ } from 'meteor/jquery';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { AdminDashboard, adminCallback } from '/imports/admin/utils';
import AdminConfig from '/imports/admin/config';

AutoForm.addHooks(['admin_insert', 'admin_update'], {
    beginSubmit() {
        return $('.btn-primary').addClass('disabled');
    },
    endSubmit() {
        return $('.btn-primary').removeClass('disabled');
    },
    onError(formType, error) {
        return AdminDashboard.alertFailure(error.message);
    },
});

AutoForm.hooks({
    admin_insert: {
        onSubmit(insertDoc, updateDoc, currentDoc) {
            const hook = this;
            Meteor.call('adminInsertDoc', insertDoc, Session.get('admin_collection_name'), function(error) {
                if (error) {
                    return hook.done(error);
                }
                return adminCallback('onInsert', [Session.get('admin_collection_name'), insertDoc, updateDoc, currentDoc], function(collection) {
                    return hook.done(null, collection);
                });
            });
            return false;
        },
        onSuccess(formType, collection) {
            AdminDashboard.alertSuccess('Successfully created');
            return Router.go(`${AdminConfig.homeUrl}/${collection}`);
        },
    },
    admin_update: {
        onSubmit(insertDoc, updateDoc, currentDoc) {
            const hook = this;
            Meteor.call('adminUpdateDoc', updateDoc, Session.get('admin_collection_name'), Session.get('admin_id'), function(error) {
                if (error) {
                    return hook.done(error);
                }
                return adminCallback('onUpdate', [Session.get('admin_collection_name'), insertDoc, updateDoc, currentDoc], function(collection) {
                    return hook.done(null, collection);
                });
            });
            return false;
        },
        onSuccess(formType, collection) {
            AdminDashboard.alertSuccess('Successfully updated');
            return Router.go(`${AdminConfig.homeUrl}/${collection}`);
        },
    },
});

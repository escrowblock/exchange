import { $ } from 'meteor/jquery';
import { parseID, adminCollectionObject } from '/imports/admin/utils';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

Template.AdminLayout.events({
    'click .btn-delete'(event) {
        const _id = $(event.target).attr('doc');
        $('#admin-delete-modal')
        .modal({
            onApprove : function() {
                return Meteor.call('adminRemoveDoc', Session.get('admin_collection_name'), parseID(_id));
            }
        })
        .modal('show');
  
        if (Session.equals('admin_collection_name', 'Users')) {
            Session.set('admin_id', _id);
            return Session.set('admin_doc', Meteor.users.findOne(_id));
        }
        
        Session.set('admin_id', parseID(_id));
        return Session.set('admin_doc', adminCollectionObject(Session.get('admin_collection_name')).findOne(parseID(_id)));
    },
});
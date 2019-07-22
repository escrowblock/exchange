import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.AdminDashboardUsersEdit.events({
    'click .btn-add-role'(event) {
        return Meteor.call('adminAddUserToRole', $(event.target).attr('user'), $(event.target).attr('role'));
    },
    'click .btn-remove-role'(event) {
        return Meteor.call('adminRemoveUserToRole', $(event.target).attr('user'), $(event.target).attr('role'));
    },
});

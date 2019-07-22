import { profile, api_key } from '/imports/collections';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.Profile.helpers({
    ProfileSchema () {
        return profile;
    },
    currentUserid () {
        return Meteor.userId();
    },
    getPushStatus () {
        const template = Template.instance();
        return template.pushStatus ? 'checked' : '';
    },
    Key () {
        return api_key.findOne({ UserId: Meteor.userId() }).Key ? api_key.findOne({ UserId: Meteor.userId() }).Key : '';
    },
    Secret () {
        return api_key.findOne({ UserId: Meteor.userId() }) ? api_key.findOne({ UserId: Meteor.userId() }).Secret : '';
    },
});

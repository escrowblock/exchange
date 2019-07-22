import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.Profile.onRendered(function () {
    const template = this;
    template.pushStatus = false;
    Meteor.call('getPushStatus', function(err, result) {
        if (err) {
            // console.log(err);
        } else {
            template.pushStatus = result;
        }
    });
    $('.menu.profileTabs .item').tab();
});

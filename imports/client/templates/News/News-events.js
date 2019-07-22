import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.NewsItem.events({
    'click a.external': (event) => {
        if (Meteor.isCordova) {
            window.open($(event.currentTarget).attr('href'), '_system');
        } else {
            window.location = $(event.currentTarget).attr('href');
        }
    },
});

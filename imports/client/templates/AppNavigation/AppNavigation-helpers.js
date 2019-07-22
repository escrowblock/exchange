import { Router } from 'meteor/iron:router';
import { Counter } from 'meteor/natestrauser:publish-performant-counts';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

Template.AppNavigation.helpers({
    active (route) {
        return !_.isUndefined(Router.current().route) && Router.current().route.getName() == route ? 'active' : '';
    },
    getCount (name) {
        if (name) {
            return Counter.get(name);
        }
        return null;
    },
});

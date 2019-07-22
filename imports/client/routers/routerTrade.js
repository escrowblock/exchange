import { Router } from 'meteor/iron:router';
import { Meteor } from 'meteor/meteor';

Router.route('/trade', function() {
    if (this.ready()) {
        this.render('Trade');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Trade',
    name: 'Trade',
    controller: 'ApplicationController',
    waitOn () {
        return [Meteor.subscribe('UserBalance')];
    },
});

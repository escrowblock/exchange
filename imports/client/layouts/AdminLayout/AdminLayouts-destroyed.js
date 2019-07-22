import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';

Template.AdminLayout.onDestroyed(function() {
    $('body').removeClass('fixed');
});

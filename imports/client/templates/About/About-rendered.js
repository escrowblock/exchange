import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';

Template.About.onRendered(function () {
    $('.ui.accordion').accordion();
});

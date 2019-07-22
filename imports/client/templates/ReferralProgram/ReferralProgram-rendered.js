import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';

Template.ReferralProgram.onRendered(function () {
    $('.menu.referralTabs .item').tab();
});

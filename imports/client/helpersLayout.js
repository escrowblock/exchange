import { Decimal } from 'meteor/mongo-decimal';
import { Router } from 'meteor/iron:router';
import { TAPi18n } from 'meteor/tap:i18n';
import { $ } from 'meteor/jquery';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { moment } from 'meteor/momentjs:moment';
import { profile } from '/imports/collections';
import { AutoForm } from 'meteor/aldeed:autoform';

Template.div.onRendered(function() {
    $(this.firstNode).get(0).className = this.data.class;
});

Template.registerHelper('formatDate', function (_date) {
    return moment(_date).format('Do MMM YYYY hh:mm A');
});

Template.registerHelper('FormatNumber', function (number, digits) {
    return Number(Decimal(number).toFixed(digits)).toLocaleString();
});

Template.registerHelper('isWeb', function () {
    return !Meteor.isCordova;
});

Template.registerHelper('titleApp', function () {
    return Meteor.settings.public.sitename;
});

Template.registerHelper('userName', function () {
    if (Meteor.userId()) {
        const profileObj = profile.findOne({ UserId: Meteor.userId() });
        return profileObj && profileObj.UserName && profileObj.UserName.trim() ? profileObj.UserName : '';
    }
    return '';
});

Template.registerHelper('currentUserid', function () {
    return Meteor.userId();
});

Template.registerHelper('currentPath', function () {
    return !_.isUndefined(Router.current().route) && Router.current().route.getName();
});

Template.registerHelper('formTypeMethod', function() {
    if (_.isEmpty(this)) {
        return 'method';
    }
    return 'method-update';
});

/**
 * @method AutoForm.getLabelForField
 * @public
 * @param {String} name The field name attribute / schema key.
 * @return {Object}
 *
 * Call this method from a UI helper to get the field definitions based on the schema used by the closest containing autoForm.
 */
AutoForm.getLabelForField = function autoFormGetLabelForField(name) {
    return TAPi18n.__(AutoForm.getFormSchema().label(name));
};

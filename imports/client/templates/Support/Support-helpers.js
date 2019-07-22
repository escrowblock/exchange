import { schemas } from '/imports/collections';
import { Template } from 'meteor/templating';

Template.Support.helpers({
    contactFormSchema () {
        return schemas.support;
    },
});

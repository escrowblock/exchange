import { Template } from 'meteor/templating';

Template.AdminLayout.helpers({
    minHeight () {
        return `${Template.instance().minHeight.get()}px`;
    },
});

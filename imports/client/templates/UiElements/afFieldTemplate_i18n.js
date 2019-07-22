import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

Template.afFieldInputI18n.helpers({
    i18nData: function i18nData() {
        if (!_.isUndefined(this.placeholder)) {
            this.placeholder = TAPi18n.__(this.placeholder);
        }
        if (!_.isUndefined(this.label) && this.label != false) {
            this.label = TAPi18n.__(this.label);
        }
        return this;
    },
});

Template.afQuickFieldI18n.helpers({
    i18nData: function i18nData() {
        if (!_.isUndefined(this.placeholder)) {
            this.placeholder = TAPi18n.__(this.placeholder);
        }
        if (!_.isUndefined(this.label) && this.label != false) {
            this.label = TAPi18n.__(this.label);
        }
        return this;
    },
});

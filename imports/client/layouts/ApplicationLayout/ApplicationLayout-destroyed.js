import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';

Template.ApplicationLayout.onDestroyed(function() {
    if (!_.isUndefined(this.tracker)) {
        this.tracker.stop();
    }
    if (!_.isUndefined(this.tracker1)) {
        this.tracker1.stop();
    }
    if (!_.isUndefined(this.tracker2)) {
        this.tracker2.stop();
    }
    $('.ui.modalAlert.hidden, .ui.modalConfirmation.hidden').remove();
});

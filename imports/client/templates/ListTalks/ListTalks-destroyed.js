import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

Template.ListTalks.onDestroyed(function() {
    if (!_.isUndefined(this.tracker)) {
        this.tracker.stop();
    }
});

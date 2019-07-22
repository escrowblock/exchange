import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';

Template.AppNavigation.onDestroyed(function() {
    if (!_.isUndefined(this.subsNotificationBadge)) {
        this.subsNotificationBadge.stop();
    }
    if (!_.isUndefined(this.subsTalkBadge)) {
        this.subsTalkBadge.stop();
    }
});

import { Template } from 'meteor/templating';

Template.AppNavigation.onCreated(function () {
    this.subsNotificationBadge = this.subscribe('NotificationBadge');
    this.subsTalkBadge = this.subscribe('TalkBadge');
});

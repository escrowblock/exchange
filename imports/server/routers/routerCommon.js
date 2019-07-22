import { _ } from 'meteor/underscore';
import { Router } from 'meteor/iron:router';
import { notification_payload, profile } from '/imports/collections';
import { Meteor } from 'meteor/meteor';

Router.route('/getPayload/:_id', function () {
    const res = this.response;
    const payload = notification_payload.findOne({ SubscriptionId: this.params._id }, { sort: { CreatedAt: -1 } });
    if (!_.isUndefined(payload)) {
        notification_payload.remove({ _id: payload._id });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(payload.data);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
}, { where: 'server' });

if (Meteor.settings.private.telegramToken) {
    Router.route(`/bot/${Meteor.settings.private.telegramToken}`, function () {
        const req = this.request;
        const res = this.response;
    
        const message = req.body;
    
        if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
            console.log(message);
        }
        
        if (message.message.text == 'Hello') {
            if (!_.isUndefined(profile.findOne({ Telegram: message.from.username }))) {
                profile.update({ Telegram: message.from.username }, { $set: { TelegramChatId: message.chat.id } });
            }
        }
    
        res.sendStatus(200);
    }, { where: 'server' });
}

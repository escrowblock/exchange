import { Meteor } from 'meteor/meteor';
import { Push } from 'meteor/raix:push';
import { HTTP } from 'meteor/http';
import { _ } from 'meteor/underscore';
import { EJSON } from 'meteor/ejson';
import { Mailer } from 'meteor/lookback:emails';
import { notification_history, notification_payload, profile } from '/imports/collections';
import { TAPi18n } from 'meteor/tap:i18n';

const sendNotification = function(title, message, recipient, path) {
    const from = 'Administrator';
    let recipient_list = [];
    if (_.isUndefined(recipient)) {
        recipient_list = Meteor.users.find({}, { fields: { _id: 1 } }).fetch();
    } else {
        recipient_list.push({ _id: recipient });
    }
    for (let i = 0; i < recipient_list.length; i += 1) {
        const userId = recipient_list[i]._id;
        const doc = {
            UserId: userId, Message: message, From: from, Path: path,
        };
        notification_history.insert(doc, function (error) {
            if (!error) {
                Push.send({
                    from,
                    title,
                    text: message,
                    // badge: 12,
                    sound: '/audio/alert.mp3',
                    query: {
                        userId,
                    },
                });
    
                Push.appCollection.find({ userId, token: { $exists: true } }).map(function(value) {
                    if (!_.isUndefined(value.token) && !_.isUndefined(value.token.gcm)) {
                        notification_payload.insert({ SubscriptionId: value.token.gcm, Data: EJSON.stringify(doc) });
                    }
                    return null;
                });
            }
        });

        const recipient = profile.findOne({ UserId: userId, $or: [{ Email: { $exists: true, $ne: '' } }, { Telegram: { $exists: true, $ne: '' } }] }, { fields: { Email: 1, Telegram: 1, TelegramChatId: 1 } });
        if (!_.isUndefined(recipient) && recipient.Email) {
            try {
                Mailer.send({
                    to: recipient.Email,
                    from: Meteor.settings.public.noreplymail,
                    template: 'notification',
                    subject: TAPi18n.__('ESCB exchange notification: %s', title),
                    data: { header: TAPi18n.__('Notification'), message },
                });
            } catch (e) {
                console.log(EJSON.stringify(e));
                // @DEBUG
                if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
                    console.log(EJSON.stringify(e));
                }
                //
            }
        }

        if (!_.isUndefined(recipient) && recipient.Telegram && recipient.TelegramChatId && Meteor.settings.private.telegramToken) {
            try {
                HTTP.post(
                    `https://api.telegram.org/bot${Meteor.settings.private.telegramToken}/sendMessage?chat_id=${recipient.TelegramChatId}`,
                    {
                        params: {
                            text: message,
                            parse_mode: 'Markdown',
                        },
                        timeout: 4000,
                    },
                );
            } catch (e) {
                console.log(EJSON.stringify(e));
                // @DEBUG
                if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
                    console.log(EJSON.stringify(e));
                }
                //
            }
        }
    }
};

export { sendNotification as default };

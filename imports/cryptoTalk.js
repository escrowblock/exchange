import cryptoMsg from 'meteor/escb:web3-crypto-message';
import { encryptMessage } from '/imports/cryptoTalkTools';
import sendNotification from '/imports/notifications';
import {
    talk, profile, talk_message,
} from '/imports/collections';
import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';

export default async function (userId, counterpartyId, ReferenceType, ReferenceId, deferredProduct, cryptoProduct) {
    const counterparty = Meteor.users.findOne(counterpartyId);
    if (userId && counterparty && Meteor.users.findOne(userId)) {
        const initiatorPublicKey = Meteor.users.findOne(userId).services.ethereum.encryptionpublickey;
        const counterpartyPublicKey = counterparty.services.ethereum.encryptionpublickey;
        const identity = cryptoMsg.createIdentity();
        const identityBody = EJSON.stringify(identity);
        const talkId = talk.insert({
            UserId: userId,
            CounterpartyId: counterpartyId,
            CountMessages: 0,
            TalkState: 'Opened',
            ReferenceType,
            ReferenceId,
        });
        
        const lang = Meteor.users.findOne({ _id: userId }, { fields: { 'profile.language': 1 } }).profile.language;
        let InitialMessage = profile.findOne({ UserId: userId }).InitialMessage ? profile.findOne({ UserId: userId }).InitialMessage : TAPi18n.__('Hi, it is the first message in this secure channel_', lang);
        InitialMessage = `${InitialMessage}\n\r ${TAPi18n.__('By trade conditions need to transfer %s %s_ After this moment you will receive deposited %s %s', { sprintf: [deferredProduct.value, deferredProduct.product, cryptoProduct.value, cryptoProduct.product] }, lang)}`;

        try {
            const initialEncryptedMessage = encryptMessage(
                InitialMessage,
                identity,
            );

            // encrypt indentity for a talk for the initiator
            const encryptedMessageForInitiator = encryptMessage(
                identityBody,
                { publicKey: initiatorPublicKey },
            );
            
            // encrypt indentity for a talk for the counterparty
            const encryptedMessageForCounterparty = encryptMessage(
                identityBody,
                { publicKey: counterpartyPublicKey },
            );
                    
            const doc = {
                TalkId: talkId,
                Message: initialEncryptedMessage,
                From: userId,
                To: counterpartyId,
                CreatedAt: new Date().getTime(),
                Status: false,
            };
            talk_message.insert(doc);

            // Send notification to the counterparty and the user
            _.map([userId, counterpartyId], function(_id) {
                const lang = Meteor.users.findOne({ _id }, { fields: { 'profile.language': 1 } }).profile.language;
                const userName = profile.findOne({ UserId: _id }, { fields: { UserName: 1 } }).UserName ? profile.findOne({ UserId: _id }, { fields: { UserName: 1 } }).UserName : TAPi18n.__('Some counterparty');

                sendNotification(TAPi18n.__('New talk', {}, lang), TAPi18n.__('You have started participating in Talk with %s', { sprintf: [userName] }, lang), _id, `/talk/${talkId}`);
            });
            
            // We store encrypted identity in db for each participants
            talk.update({ _id: talkId }, {
                $set:
                                            {
                                                Identity: [
                                                    {
                                                        UserId: userId,
                                                        Body: encryptedMessageForInitiator,
                                                    },
                                                    {
                                                        UserId: counterpartyId,
                                                        Body: encryptedMessageForCounterparty,
                                                    },
                                                ],
                                                DateLastMessage: new Date().getTime(),
                                            },
                $inc: { CountMessages: 1 },
            });
        } catch (e) {
            // @TODO check that it can happen only in test mode
            console.log(e);
        }
    }
}

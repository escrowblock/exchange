import cryptoMsg from 'meteor/escb:web3-crypto-message';
import sendNotification from '/imports/notifications';
import {
    talk, profile, talk_message,
} from '/imports/collections';
import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';

export const createNewTalk = async function (userId, counterpartyId, ReferenceType, ReferenceId, deferredProduct, cryptoProduct) {
    const counterparty = Meteor.users.findOne(counterpartyId);
    if (userId && counterparty && Meteor.users.findOne(userId)) {
        const initiatorPublicKey = Meteor.users.findOne(userId).services.ethereum.publickey;
        const counterpartyPublicKey = counterparty.services.ethereum.publickey;
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
        let InitialMessage = profile.findOne({ UserId: userId }).InitialMessage ? profile.findOne({ UserId: userId }).InitialMessage : TAPi18n.__('Hi, it is the first message in this secure channel.', lang);
        InitialMessage = `${InitialMessage}\n\r ${TAPi18n.__('By trade conditions need to transfer %s %s. After this moment you will receive deposited %s %s', { sprintf: [deferredProduct.value, deferredProduct.product, cryptoProduct.value, cryptoProduct.product] }, lang)}`;
        
        try {
            cryptoMsg.encryptWithPublicKey(
                identity.publicKey,
                InitialMessage,
            ).then((initialEncryptedMessage) => {
                // encrypt indentity for a talk for the initiator
                cryptoMsg.encryptWithPublicKey(
                    initiatorPublicKey,
                    identityBody,
                ).then((encryptedMessageForInitiator) => {
                    // encrypt indentity for a talk for the counterparty
                    cryptoMsg.encryptWithPublicKey(
                        counterpartyPublicKey,
                        identityBody,
                    ).then(Meteor.bindEnvironment((encryptedMessageForCounterparty) => {
                        const doc = {
                            TalkId: talkId,
                            Message: cryptoMsg.cipher.stringify(initialEncryptedMessage),
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
                                                                    Body: cryptoMsg.cipher.stringify(encryptedMessageForInitiator),
                                                                },
                                                                {
                                                                    UserId: counterpartyId,
                                                                    Body: cryptoMsg.cipher.stringify(encryptedMessageForCounterparty),
                                                                },
                                                                {
                                                                    UserId: 'Plain', // @TODO - remove after Metamask will add decrypt implementation
                                                                    Body: identityBody,
                                                                },
                                                            ],
                                                            DateLastMessage: new Date().getTime(),
                                                        },
                            $inc: { CountMessages: 1 },
                        });
                    }));
                });
            });
        } catch (e) {
            // @TODO check that it can happen only in test mode
            console.log(e);
        }
    }
};

export const addArbitrationToTalk = async function (TalkId) {
    const _talk = talk.findOne({ _id: TalkId, TalkState: 'Disputed' });
    const arbitration = Meteor.users.findOne({ 'roles.__global_roles__': 'arbitration', _id: { $nin: [_talk.UserId, _talk.CounterpartyId] } });

    if (arbitration && _talk) {
        const arbitrationPublicKey = arbitration.services.ethereum.publickey;

        let channelIdentity;
        const values = Object.values(_talk.Identity);
        for (let i = 0; i < values.length; i += 1) {
            if (values[i].UserId == Meteor.userId()) { // @TODO after Metamask will add decrypt implementation

            }
            if (values[i].UserId == 'Plain') {
                channelIdentity = EJSON.parse(values[i].Body);
            }
        }
        
        try {
            // encrypt indentity for a talk for the arbitration
            cryptoMsg.encryptWithPublicKey(
                arbitrationPublicKey,
                EJSON.stringify(channelIdentity),
            ).then(Meteor.bindEnvironment((encryptedMessageForArbitration) => {
                // We store encrypted identity in db for each participants
                talk.update({ _id: TalkId }, {
                    $set: { ArbitrationId: arbitration._id },
                    $push: {
                        Identity:
                                                            {
                                                                UserId: arbitration._id,
                                                                Body: cryptoMsg.cipher.stringify(encryptedMessageForArbitration),
                                                            },
                    },
                });
            }));
            
            const lang = arbitration.profile.language;
            sendNotification(TAPi18n.__('You have the new request for trade arbitration', {}, lang), TAPi18n.__('You have to participate in the talk and resolve a dispute between two counterparties.', lang), arbitration._id, `/talk/${TalkId}`);
        } catch (e) {
            // @TODO check that it can happen only in test mode
            console.log(e);
        }
    }
};

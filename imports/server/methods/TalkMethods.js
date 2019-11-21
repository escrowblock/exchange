import sendNotification from '/imports/notifications';
import {
    talk_message, talk, profile, user_files, schemas,
} from '/imports/collections';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EJSON } from 'meteor/ejson';
import { TAPi18n } from 'meteor/tap:i18n';
import {
    closeTalkConfirmTrade, closeTalkRefuseTrade, resolveDisputeTrade,
} from '/imports/tools';
import util from 'ethereumjs-util';

Meteor.methods({
    setReadMessage (TalkId) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        talk_message.update({ TalkId, To: Meteor.userId(), Status: false }, { $set: { Status: true, ReadAt: new Date().getTime() } }, { multi: true });
    },
    sendMessageToTalk (docArg) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        const doc = Object.assign(docArg);
        doc.From = Meteor.userId();
        doc.CreatedAt = new Date().getTime();
        doc.Status = false;
        const talk_instance = talk.findOne({ _id: doc.TalkId, $or: [{ ArbitrationId: Meteor.userId() }, { UserId: Meteor.userId() }, { CounterpartyId: Meteor.userId() }], TalkState: { $in: ['Opened', 'Disputed'] } }, { fields: { ArbitrationId: 1, CounterpartyId: 1, UserId: 1 } });
        if (!talk_instance) {
            throw new Meteor.Error("You don't have permissions on this action");
        }
    
        const _notifications = [];
        if (talk_instance.ArbitrationId != Meteor.userId()) {
            doc.To = talk_instance.UserId != Meteor.userId() ? talk_instance.UserId : talk_instance.CounterpartyId;
            _notifications.push({
                lang: Meteor.users.findOne({ _id: doc.To }, { fields: { 'profile.language': 1 } }).profile.language,
                userId: doc.To,
                userName: profile.findOne({ UserId: doc.From }, { fields: { UserName: 1 } }).UserName ? profile.findOne({ UserId: doc.From }, { fields: { UserName: 1 } }).UserName : TAPi18n.__('Some counterparty'),
            });
        } else {
            doc.To = 'All';
            const _arbitrationUser = profile.findOne({ UserId: doc.From }, { fields: { UserName: 1 } }).UserName ? profile.findOne({ UserId: doc.From }, { fields: { UserName: 1 } }).UserName : TAPi18n.__('Some counterparty');
            _notifications.push({
                lang: Meteor.users.findOne({ _id: talk_instance.UserId }, { fields: { 'profile.language': 1 } }).profile.language,
                userId: talk_instance.UserId,
                userName: _arbitrationUser,
            });
            _notifications.push({
                lang: Meteor.users.findOne({ _id: talk_instance.CounterpartyId }, { fields: { 'profile.language': 1 } }).profile.language,
                userId: talk_instance.CounterpartyId,
                userName: _arbitrationUser,
            });
        }

        // @DEBUG
        if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
            console.debug(EJSON.stringify(doc));
        }
        //

        check(doc, schemas.talk_message);
        const last_id = talk_message.insert(doc);
        if (last_id) {
            talk.update({ _id: doc.TalkId }, { $inc: { CountMessages: 1 }, $set: { DateLastMessage: new Date().getTime() } });
        }
        this.unblock();
        _.map(_notifications, function(obj) {
            sendNotification(TAPi18n.__('New message', {}, obj.lang), TAPi18n.__('You have got a new message from %s', { sprintf: [obj.userName] }, obj.lang), obj.userId, `/talk/${doc.TalkId}`);
        });
        return last_id;
    },
    setEncryptionPublicKey (encryptionpublickey) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        Meteor.users.update({ _id: Meteor.userId() }, { $set: { 'services.ethereum.encryptionpublickey': encryptionpublickey } });
    },
    confirmTrade (TalkId) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        this.unblock();
        const _talk = talk.findOne({ _id: TalkId, UserId: Meteor.userId(), TalkState: 'Opened' }, { fields: { ReferenceType: 1, ReferenceId: 1, CounterpartyId: 1 } });
        if (!_.isUndefined(_talk) && _talk.ReferenceType == 'Trade') {
            closeTalkConfirmTrade(_talk.ReferenceId);

            talk.update({ _id: TalkId, UserId: Meteor.userId() }, { $set: { TalkState: 'Closed' } });
            const lang = Meteor.users.findOne({ _id: _talk.CounterpartyId }, { fields: { 'profile.language': 1 } }).profile.language;
            const userName = profile.findOne({ UserId: _talk.CounterpartyId }, { fields: { UserName: 1 } }).UserName ? profile.findOne({ UserId: _talk.CounterpartyId }, { fields: { UserName: 1 } }).UserName : TAPi18n.__('Some counterparty');
            sendNotification(TAPi18n.__('Trade is confirmed', {}, lang), TAPi18n.__('You have got the confirmation by the trade %s with %s', { sprintf: [_talk.ReferenceId, userName] }, lang), _talk.CounterpartyId, '/transactions');
        }
    },
    refuseTrade (TalkId) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        this.unblock();
        const _talk = talk.findOne({ _id: TalkId, CounterpartyId: Meteor.userId(), TalkState: 'Opened' }, { fields: { ReferenceType: 1, ReferenceId: 1, UserId: 1 } });
        if (!_.isUndefined(_talk) && _talk.ReferenceType == 'Trade') {
            closeTalkRefuseTrade(_talk.ReferenceId);
      
            talk.update({ _id: TalkId, CounterpartyId: Meteor.userId() }, { $set: { TalkState: 'Closed' } });
            const lang = Meteor.users.findOne({ _id: _talk.UserId }, { fields: { 'profile.language': 1 } }).profile.language;
            const userName = profile.findOne({ UserId: _talk.UserId }, { fields: { UserName: 1 } }).UserName ? profile.findOne({ UserId: _talk.UserId }, { fields: { UserName: 1 } }).UserName : TAPi18n.__('Some counterparty');
            sendNotification(TAPi18n.__('Trade is refused', {}, lang), TAPi18n.__('%s has refused the trade %s', { sprintf: [userName, _talk.ReferenceId] }, lang), _talk.UserId, '/transactions');
        }
    },
    getEncryptionPublicKeyArbitration (TalkId) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        this.unblock();
        
        const _talk = talk.findOne({ _id: TalkId, TalkState: 'Opened' });
        const arbitration = Meteor.users.findOne({ 'roles.__global_roles__': 'arbitration', _id: { $nin: [_talk.UserId, _talk.CounterpartyId] } }, { fields: { _id: 1, services: 1 } });

        if (arbitration && _talk) {
            return { ArbitrationUserId: arbitration._id, EncryptionPublicKey: arbitration.services.ethereum.encryptionpublickey };
        }
        throw new Meteor.Error(404, "Arbitration doesn't have the authority to provide this service_ Please, talk with the support service_");
    },
    callArbitration (TalkId, ArbitrationUserId, EncryptedMessageForArbitration) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        if (_.isUndefined(Meteor.users.findOne({ 'roles.__global_roles__': 'arbitration', _id: ArbitrationUserId }))) {
            throw new Meteor.Error(403, "Arbitration doesn't have the authority to provide this service_ Please, talk with the support service_");
        }
        this.unblock();
        const _talk = talk.findOne({ _id: TalkId, $or: [{ CounterpartyId: Meteor.userId() }, { UserId: Meteor.userId() }], TalkState: 'Opened' }, {
            fields: {
                ReferenceType: 1, ReferenceId: 1, UserId: 1, CounterpartyId: 1,
            },
        });
        if (!_.isUndefined(_talk) && _talk.ReferenceType == 'Trade') {
            talk.update({ _id: TalkId, $or: [{ CounterpartyId: Meteor.userId() }, { UserId: Meteor.userId() }] }, { $set: { TalkState: 'Disputed' } }, function () {
                talk.update({ _id: TalkId }, {
                    $set: { ArbitrationId: ArbitrationUserId },
                    $push: {
                        Identity:
                                                            {
                                                                UserId: ArbitrationUserId,
                                                                Body: EncryptedMessageForArbitration,
                                                            },
                    },
                });
                
                const langArbitration = Meteor.users.findOne({ _id: ArbitrationUserId }, { fields: { 'profile.language': 1 } }).profile.language;
                sendNotification(TAPi18n.__('You have the new request for trade arbitration', {}, langArbitration), TAPi18n.__('You have to participate in the talk and resolve a dispute between two counterparties_', langArbitration), ArbitrationUserId, `/talk/${TalkId}`);
                
                const _receiver = _talk.UserId != Meteor.userId() ? _talk.CounterpartyId : _talk.UserId;
                const langReceiver = Meteor.users.findOne({ _id: _receiver }, { fields: { 'profile.language': 1 } }).profile.language;
                const userName = profile.findOne({ UserId: _receiver }, { fields: { UserName: 1 } }).UserName ? profile.findOne({ UserId: _receiver }, { fields: { UserName: 1 } }).UserName : TAPi18n.__('Some counterparty');
      
                sendNotification(TAPi18n.__('Trade is in disputed status', {}, langReceiver), TAPi18n.__('%s has transferred the trade %s to the disputed status', { sprintf: [userName, _talk.ReferenceId] }, langReceiver), _receiver, `/talk/${TalkId}`);
            });
        }
    },
    resolveDispute (TalkId, approvedAmount, symbol, signature) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        check(TalkId, String);
        check(approvedAmount, Number);
        check(symbol, String);
        check(signature, String);
      
        this.unblock();
        const _talk = talk.findOne({ _id: TalkId, ArbitrationId: Meteor.userId(), TalkState: 'Disputed' }, {
            fields: {
                ReferenceType: 1, ReferenceId: 1, UserId: 1, CounterpartyId: 1,
            },
        });
        if (!_.isUndefined(_talk) && _talk.ReferenceType == 'Trade') {
            const msg = `Resolve disput for ${TalkId} with approve amount ${approvedAmount} ${symbol}`;
            const msgBuffer = util.toBuffer(msg);
            const msgHash = util.hashPersonalMessage(msgBuffer);
            const signatureBuffer = util.toBuffer(signature);
            const signatureParams = util.fromRpcSig(signatureBuffer);
            const publickey = util.ecrecover(
                msgHash,
                signatureParams.v,
                signatureParams.r,
                signatureParams.s,
            );
      
            let _DbPublickey = '';
            try {
                _DbPublickey = Meteor.users.findOne({ _id: Meteor.userId() }).services.ethereum.publickey;
            } catch (e) {
                throw new Meteor.Error("The operation can't be confirmed");
            }
      
            if (_DbPublickey != publickey.toString('hex')) {
                throw new Meteor.Error('Your signature is wrong');
            }
    
            resolveDisputeTrade(_talk.ReferenceId, approvedAmount);
      
            talk.update({ _id: TalkId, ArbitrationId: Meteor.userId() }, { $set: { TalkState: 'Closed' } });
      
            _.map([_talk.UserId, _talk.CounterpartyId], function(_UserId) {
                const lang = Meteor.users.findOne({ _id: _UserId }, { fields: { 'profile.language': 1 } }).profile.language;
                sendNotification(TAPi18n.__('The dispute for trade is resolved', {}, lang), TAPi18n.__('The arbitration has resolved the trade %s', { sprintf: [_talk.ReferenceId] }, lang), _UserId, '/transactions');
            });
        }
    },
    deleteFile (id) {
        check(id, String);
        user_files.remove({ _id: id, userId: Meteor.userId() });
    },
});

import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import {
    talk, profile, talk_message, trade, user_files,
} from '/imports/collections';
import { Counter } from 'meteor/natestrauser:publish-performant-counts';

Meteor.publish('Talk', function(TalkId, limitArg = 50) {
    if (this.userId) {
        check(TalkId, String);
        check(limitArg, Number);
        const limit = limitArg > 100 ? 100 : limitArg;
        const _talk = talk.find({ _id: TalkId, $or: [{ ArbitrationId: this.userId }, { UserId: this.userId }, { CounterpartyId: this.userId }], TalkState: { $in: ['Opened', 'Disputed'] } });
        if (_talk.count() == 0) {
            this.ready();
            return false;
        }
    
        let _counterparty_profile;
        if (_talk.fetch()[0].UserId != this.userId) {
            _counterparty_profile = profile.find({ UserId: _talk.fetch()[0].UserId }, { fields: { UserId: 1, UserName: 1 } });
        } else {
            _counterparty_profile = profile.find({ UserId: _talk.fetch()[0].CounterpartyId }, { fields: { UserId: 1, UserName: 1 } });
        }
    
        const _userData = Meteor.users.find({ _id: { $in: [_talk.fetch()[0].ArbitrageId, _talk.fetch()[0].UserId, _talk.fetch()[0].CounterpartyId] } }, { fields: { 'services.ethereum.id': 1 } });
    
        const _talk_message = talk_message.find(
            { TalkId: _talk.fetch()[0]._id },
            { limit, sort: { CreatedAt: -1 } },
        );
    
        const out = [_talk, _counterparty_profile, _userData, _talk_message];
    
        if (_talk.fetch()[0].ReferenceType == 'Trade') {
            const _trade = trade.find({ ExecutionId: _talk.fetch()[0].ReferenceId, Side: 'Sell' }, {
                fields: {
                    Quantity: 1, Value: 1, InstrumentSymbol: 1, Side: 1, ExecutionId: 1, Initial: 1,
                },
            });
    
            out.push(_trade);
        }
    
        return out;
    }
    this.ready();
    return null;
});

Meteor.publish('UserStatus', function() {
    if (this.userId) {
        const { userId } = this;
        const _talks = talk.find({ $or: [{ ArbitrationId: this.userId }, { UserId: this.userId }, { CounterpartyId: this.userId }], TalkState: { $in: ['Opened', 'Disputed'] } }, { fields: { CounterpartyId: 1, UserId: 1 } }).fetch();
        const UserIds = _.map(_talks, function(obj) {
            return userId == obj.UserId ? obj.CounterpartyId : obj.UserId;
        });
        return !_.isEmpty(UserIds) ? Meteor.users.find({ 'profile.online': true, _id: { $in: UserIds } }, { fields: { 'profile.online': 1 } }) : this.ready();
    }
    this.ready();
    return null;
});

Meteor.publish('TalkHistory', function(TalkId, limit) {
    if (this.userId) {
        check(TalkId, String);
        const _limit = parseInt(limit, 10) || 50;
        check(_limit, Match.Maybe(Number));
        return talk_message.find({ TalkId, $or: [{ ArbitrationId: this.userId }, { UserId: this.userId }, { CounterpartyId: this.userId }] }, { limit: _limit, sort: { date: -1 } });
    }
    this.ready();
    return null;
});

Meteor.publish('ListTalks', function(limitArg = 50) {
    if (this.userId) {
        check(limitArg, Number);
        const limit = limitArg > 100 ? 100 : limitArg;
        const self = this;
        const handle = talk.find({ $or: [{ ArbitrationId: self.userId }, { UserId: self.userId }, { CounterpartyId: self.userId }], TalkState: { $in: ['Opened', 'Disputed'] } }, { limit, sort: { DateLastMessage: -1 } })
            .observe({
                added(docArg) {
                    const doc = docArg;
                    if (self.userId != doc.UserId) {
                        doc.profile = profile.findOne({ UserId: doc.UserId }, { fields: { UserName: 1 } });
                        doc.ethaddress = Meteor.users.findOne({ _id: doc.UserId }, { fields: { 'services.ethereum.id': 1 } }).services.ethereum.id;
                    } else {
                        doc.profile = profile.findOne({ UserId: doc.CounterpartyId }, { fields: { UserName: 1 } });
                        doc.ethaddress = Meteor.users.findOne({ _id: doc.CounterpartyId }, { fields: { 'services.ethereum.id': 1 } }).services.ethereum.id;
                    }
                    doc.talk_message = talk_message.findOne({ TalkId: doc._id }, { sort: { CreatedAt: -1 }, fields: { Message: 1, CreatedAt: 1 } });
                    self.added('talk', doc._id, doc);
                },
                changed(docArg) {
                    const doc = docArg;
                    if (self.userId != doc.UserId) {
                        doc.profile = profile.findOne({ UserId: doc.UserId }, { fields: { UserName: 1 } });
                        doc.ethaddress = Meteor.users.findOne({ _id: doc.UserId }, { fields: { 'services.ethereum.id': 1 } }).services.ethereum.id;
                    } else {
                        doc.profile = profile.findOne({ UserId: doc.CounterpartyId }, { fields: { UserName: 1 } });
                        doc.ethaddress = Meteor.users.findOne({ _id: doc.CounterpartyId }, { fields: { 'services.ethereum.id': 1 } }).services.ethereum.id;
                    }
                    doc.talk_message = talk_message.findOne({ TalkId: doc._id }, { sort: { CreatedAt: -1 }, fields: { Message: 1, CreatedAt: 1 } });
                    self.changed('talk', doc._id, doc);
                },
                removed(doc) {
                    self.removed('talk', doc._id);
                },
            });
  
        self.ready();
        self.onStop(function () {
            handle.stop();
        });
    } else {
        this.ready();
    }
    return null;
});

Meteor.publish('TalkBadge', function() {
    if (this.userId) {
        const counters = [];
        const _cursor = talk.find({ $or: [{ ArbitrationId: this.userId }, { UserId: this.userId }, { CounterpartyId: this.userId }], TalkState: { $in: ['Opened', 'Disputed'] } });
        const _ids = _cursor.map(function(obj) {
            return obj._id;
        });

        counters.push(new Counter('TalkBadge', talk_message.find({ TalkId: { $in: _ids }, Status: false }), 3000));
        counters.push(new Counter('TalkBadgeTotal', _cursor, 3000));
        return counters;
    }
    this.ready();
    return null;
});

Meteor.publish('TalkFiles', function () {
    if (this.userId) {
        const _talks = talk.find({ $or: [{ ArbitrationId: this.userId }, { UserId: this.userId }, { CounterpartyId: this.userId }], TalkState: { $in: ['Opened', 'Disputed'] } }, { fields: { CounterpartyId: 1, UserId: 1 } }).fetch();
        const UserIds = _.map(_talks, function(obj) {
            return this.userId == obj.userId ? obj.CounterpartyId : obj.userId;
        });
        UserIds.push(this.userId);
        return !_.isEmpty(UserIds) ? user_files.find({ userId: { $in: UserIds } }).cursor : this.ready();
    }
    this.ready();
    return null;
});

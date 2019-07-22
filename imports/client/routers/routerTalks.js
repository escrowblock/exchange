import { Router } from 'meteor/iron:router';
import { profile, talk, talk_message } from '/imports/collections.js';
import { TAPi18n } from 'meteor/tap:i18n';
import { Meteor } from 'meteor/meteor';

Router.route('/talks', function() {
    if (this.ready()) {
        this.render('ListTalks');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Talks',
    name: 'Talks',
    controller: 'ClientAreaController',
    waitOn() {
        return [
            Meteor.subscribe('ListTalks'),
            Meteor.subscribe('UserStatus'),
        ];
    },
});

Router.route('/talk/:_id', function() {
    if (this.ready()) {
        this.render('Talk');
    } else {
        this.render('spinner');
    }
}, {
    title: 'Talk',
    name: 'Talk',
    controller: 'ClientAreaController',
    data() {
        const _talk = talk.findOne({ _id: this.params._id });
        if (_talk) {
            let _counterpartyProfile;
            let userData;
            if (_talk.UserId != Meteor.userId()) {
                _counterpartyProfile = profile.findOne({ UserId: _talk.UserId });
                userData = Meteor.users.findOne({ _id: _talk.UserId });
            } else {
                _counterpartyProfile = profile.findOne({ UserId: _talk.CounterpartyId });
                userData = Meteor.users.findOne({ _id: _talk.CounterpartyId });
            }
            if (_counterpartyProfile && userData) {
                return {
                    UserName: _counterpartyProfile.UserName && _counterpartyProfile.UserName.trim() ? _counterpartyProfile.UserName : TAPi18n.__('Some counterparty'),
                    Talk: _talk,
                    Messages: talk_message.find({ TalkId: _talk._id }, { sort: { CreatedAt: 1 } }),
                };
            }
            return false;
        }
        return false;
    },
    waitOn() {
        return [
            Meteor.subscribe('Talk', this.params._id),
            Meteor.subscribe('UserStatus'),
            Meteor.subscribe('TalkFiles'),
        ];
    },
});

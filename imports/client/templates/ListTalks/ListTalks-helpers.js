import { decryptMessage } from '/imports/cryptoTalkTools';
import { talk } from '/imports/collections';
import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';

Template.ListTalks.helpers({
    list() {
        return talk.find().count();
    },
    listTalks() {
        return talk.find();
    },
    getTalkInfo() {
        const instance = Template.instance();
        const UserName = this.profile && this.profile.UserName && this.profile.UserName.trim() ? this.profile.UserName : TAPi18n.__('Some counterparty');
        let channelIdentity;

        const values = Object.values(this.Identity);
        for (let i = 0; i < values.length; i += 1) {
            if (values[i].UserId == Meteor.userId()) {
                // @TODO after Metamask will add decrypt implementation
            }
            if (values[i].UserId == 'Plain') {
                channelIdentity = EJSON.parse(values[i].Body);
            }
        }

        decryptMessage(this.talk_message.Message, channelIdentity).then((result) => {
            instance.decryptedMessage.set(result);
        });

        return {
            UserName,
            TalkId: this._id,
            CreatedAt: this.talk_message.CreatedAt,
            Ethaddress: this.ethaddress,
            Message: instance.decryptedMessage.get(),
            CounterpartyId: this.CounterpartyId,
            UserId: this.UserId,
        };
    },
});

Template.ListTalksItem.helpers({
    online () {
        if (this.talk) {
            const UserId = this.talk.UserId != Meteor.userId() ? this.talk.UserId : this.talk.CounterpartyId;
            if (!_.isUndefined(Meteor.users.findOne({ _id: UserId }))) {
                return Meteor.users.findOne({ _id: UserId }).profile ? Meteor.users.findOne({ _id: UserId }).profile.online : false;
            }
            return false;
        }
        return false;
    },
    identiconData (identityArg) {
        const identity = _.isString(identityArg) ? identityArg.toLowerCase() : identityArg;
        // remove items if the cache is larger than 50 entries
        if (_.size(Template.instance().cacheIdenticon) > 50) {
            delete Template.instance().cacheIdenticon[Object.keys(Template.instance().cacheIdenticon)[0]];
        }
        if (Template.instance().cacheIdenticon[`ID_${identity}`]) {
            return Template.instance().cacheIdenticon[`ID_${identity}`];
        }
        Template.instance().cacheIdenticon[`ID_${identity}`] = window.blockies.create({ seed: identity, size: 8, scale: 8 }).toDataURL();
        return Template.instance().cacheIdenticon[`ID_${identity}`];
    },
});

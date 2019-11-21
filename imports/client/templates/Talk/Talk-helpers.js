import { decryptMessage } from '/imports/cryptoTalkTools';
import { moment } from 'meteor/momentjs:moment';
import { talk, talk_message } from '/imports/collections';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.Talk.helpers({
    puredate () {
        const instance = Template.instance();
        const formatDate = moment(this.CreatedAt).format('Do MMM YYYY, hh:mm A');
        instance.prevPureDate = formatDate;
        return formatDate;
    },
    isAuthor () {
        return Meteor.userId() == this.From ? 'right' : 'left';
    },
    isArbitration () {
        return talk.findOne({ ArbitrationId: this.From }) ? 'arbitration' : '';
    },
    preparedFiles () {
        const _files_links = [];
        if (!_.isUndefined(this.Files)) {
            _.map(this.Files, function (file) {
                let icon = 'file';
                switch (file.Type) {
                case 'text/plain':
                    icon = 'file alternate';
                    break;
                case 'image/jpeg':
                case 'image/png':
                    icon = 'file image';
                    break;
                case 'video/mp4':
                    icon = 'file video';
                    break;
                case 'application/pdf':
                    icon = 'file pdf';
                    break;
                case 'audio/mpeg':
                    icon = 'file audio';
                    break;
                default:
                    break;
                }
                _files_links.push(`<a href="${file.Link}" data-type="${file.Type}" data-name="${file.Name}" class="ipfs" target="_blank"><i class="icon ${icon}"></i> ${file.Name}</a>`);
            });
        }
        if (_files_links.length > 0) {
            return _files_links.join(', ');
        }
        return '';
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
    signature () {
        return Meteor.users.findOne(this.From) ? Meteor.users.findOne(this.From).services.ethereum.id : '';
    },
    status () {
        if (this.Talk) {
            const UserId = this.Talk.UserId != Meteor.userId() ? this.Talk.UserId : this.Talk.CounterpartyId;
            if (!_.isUndefined(Meteor.users.findOne({ _id: UserId }))) {
                return Meteor.users.findOne({ _id: UserId }).profile && Meteor.users.findOne({ _id: UserId }).profile.online ? 'online' : 'offline';
            }
            return 'offline';
        }
        return 'offline';
    },
    count () {
        return talk_message.find().count();
    },
    channelIdentity() {
        return !_.isUndefined(Session.get(`channelIdentity${this.Talk._id}`)) ? Session.get(`channelIdentity${this.Talk._id}`) : false;
    },
    decrypt (id, message) {
        const { data } = Template.instance();
        if (Session.get(`channelIdentity${data.Talk._id}`)) {
            const instance = Template.instance();
            if (!_.isUndefined(instance.decryptedMessages.get(id))) {
                return instance.decryptedMessages.get(id);
            }
            instance.decryptedMessages.set(id, message ? decryptMessage(message, Session.get(`channelIdentity${data.Talk._id}`)) : '');
            return instance.decryptedMessages.get(id);
        }
        return '';
    },
    refuseButton () {
        return this.Talk && this.Talk.TalkState == 'Opened' && this.Talk.UserId != Meteor.userId();
    },
    confirmButton () {
        return this.Talk && this.Talk.TalkState == 'Opened' && this.Talk.UserId == Meteor.userId();
    },
    arbitrationButton () {
        return this.Talk && this.Talk.TalkState == 'Opened';
    },
    resolveButton () {
        return this.Talk && this.Talk.TalkState == 'Disputed' && this.Talk.ArbitrationId == Meteor.userId();
    },
});

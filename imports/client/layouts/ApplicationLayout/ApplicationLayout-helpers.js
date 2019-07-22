import { TAPi18n } from 'meteor/tap:i18n';
import { variable, profile } from '/imports/collections';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.ApplicationLayout.helpers({
    alert_bottom: () => {
        const value = variable.findOne({ name: 'alert_bottom', instance: Session.get('currentLanguage') });
        return value ? 'alert-bottom-wrapper' : false;
    },
    version: () => Meteor.settings.public.version,
    alert_bottom_text: () => {
        const value = variable.findOne({ name: 'alert_bottom', instance: Session.get('currentLanguage') });
        return value ? value.value : '';
    },
    currentAddress: () => {
        if (Session.get('walletAddress')) {
            return `${TAPi18n.__('Current address')} ${`${String(Session.get('walletAddress')).substr(0, 6)}...${String(Session.get('walletAddress')).substr(-4)}`}`;
        }
        return `<a href="/wallet">${TAPi18n.__('Sign in/ Sign up')}</a>`;
    },
    identiconData: () => {
        if (_.isUndefined(profile.findOne({ UserId: Meteor.userId() }))) {
            return '*';
        }
        let identity = profile.findOne({ UserId: Meteor.userId() }).ethaddress;
        identity = _.isString(identity) ? identity.toLowerCase() : identity;
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

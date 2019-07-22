import { modalAlert } from '/imports/modal';
import shareList from '/imports/share';
import { TAPi18n } from 'meteor/tap:i18n';
import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.ReferralProgram.events({
    'click .itemSelect': (event) => {
        $(event.currentTarget).parent().find('.itemSelect').removeClass('selected');
        $(event.currentTarget).addClass('selected');
        let shareUrl = shareList[$(event.currentTarget).data('item')];
        if (shareUrl) {
            shareUrl = shareUrl.replace('{{TEMPLATE_TEXT}}', TAPi18n.__('Text for sharing'));
            shareUrl = shareUrl.replace('{{TEMPLATE_URL}}', `${Meteor.absoluteUrl()}ref/${Session.get('walletAddress')}`);
            shareUrl = shareUrl.replace('{{TEMPLATE_IMAGE}}', `${Meteor.absoluteUrl()}escrow_1024.png`);
            if (Meteor.isCordova) {
                window.open(shareUrl, '_system');
            } else {
                window.location = shareUrl;
            }
        } else {
            modalAlert(TAPi18n.__('The referral link'), `${Meteor.absoluteUrl()}ref/${Session.get('walletAddress')}`);
        }
    },
    'click #copySignature': (event, templateInstance) => {
        const copyText = templateInstance.find('#bodySignature');
        copyText.select();
        document.execCommand('copy');
        modalAlert(TAPi18n.__('Copied!'));
    },
});

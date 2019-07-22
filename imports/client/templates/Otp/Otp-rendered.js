import { profile } from '/imports/collections';
import { TAPi18n } from 'meteor/tap:i18n';
import { modalAlert } from '/imports/modal';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.Otp.onRendered(function () {
    const currentUser = Meteor.users.findOne({ _id: Meteor.userId() });
    const currentProfile = profile.findOne({ UserId: Meteor.userId() });
    if (currentUser && _.isUndefined(currentUser.onePassCode) && !currentUser.onePassCode.activated) {
        Meteor.call('cancelInitOTP', function(error) {
            if (error) {
                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                return;
            }
            Meteor.call('initOTP', `${currentProfile.ethaddress.substr(0, 5)}...${currentProfile.ethaddress.substr(-3)}`, function(error, result) {
                if (error) {
                    modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                    return;
                }
                $('#otpWrapper').removeClass('loading');
                $('#otpImage').attr('src', result.otpImage);
                $('#otpUrl').attr('href', result.otpURL);
                if (Meteor.isCordova) {
                    $('#otpUrl').attr('onclick', `window.open('${result.otpURL}', '_system');`);
                }
                $('#otpCode').text(result.otpCode);
            });
        });
    }
});

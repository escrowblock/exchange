import { TAPi18n } from 'meteor/tap:i18n';
import { $ } from 'meteor/jquery';
import { MeteorOTP } from 'meteor/pascoual:otp';
import { Meteor } from 'meteor/meteor';

const modalAlert = function(title, content = '', time = 0) {
    $('.modalAlert-title').html(title);
    $('.modalAlert-content').html(content);
    $('.ui.modalAlert').modal('show');
    if (time) {
        setTimeout(() => {
            $('.ui.modalAlert').modal('hide');
        }, time);
    }
};

const modalConfirmation = function(title, content = '', fail = () => {}, resolve = () => {}, cancel = 'No', ok = 'Yes') {
    $('.modalConfirmation-title').html(title);
    $('.modalConfirmation-content').html(content);
    $('.modalConfirmation .button.cancel').html(TAPi18n.__(cancel));
    $('.modalConfirmation .button.ok').html(TAPi18n.__(ok));

    $('.ui.modalConfirmation').modal({
        closable: false,
        onDeny: fail,
        onApprove: resolve,
    }).modal('show');
};

const modalCodeOTP = function(callback) {
    $('.ui.modalOTP').modal({
        closable: true,
        onApprove() {
            Meteor.call('checkOTP', $('#OTPCode').val(), function (err, res) {
                if (err) {
                    callback(err);
                    return false;
                }
                if (res) { // only set a result if OTP is ok
                    callback(null, res);
                } else {
                    callback(new Meteor.Error(401, 'OTP code is incorrect!'));
                }
                return null;
            });
        },
    }).modal('show');
};

const confirmationWithOTP = function (callback) {
    try {
        if (MeteorOTP.checkOTPExpiration(Meteor.user())) {
            modalCodeOTP(callback);
            return;
        }
    } catch (err) {
        callback(new Meteor.Error(501, "You don't have OTP activated on your user account"));
    }
    // run the callback: OTP is not expired
    callback(null, true);
};

const modalConfirmationOTP = function(callback) {
    modalConfirmation(
        TAPi18n.__('Confirmation'),
        TAPi18n.__('OTP_CONFIRMATION_MODAL'),
        function() {
            callback(new Meteor.Error(401, 'Declined action'), false);
        },
        function() {
            confirmationWithOTP(callback);
        },
    );
};

export { modalAlert, modalConfirmation, modalConfirmationOTP };

import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.CreateWallet.onRendered(function () {
    if (Session.get('personalWalletCreated')) {
        setTimeout(function() {
            $('#walletAddress').val(Session.get('walletAddress')).attr('readonly', 'readonly');
        }, 1000);
    }
});

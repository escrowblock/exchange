import {
    generateWeb3WalletEngineProvider, signatureAuth, generateNewWallet, unlockWallet,
} from '/imports/client/blockchain'; // generateWeb3EngineLedgerProvider, generateWeb3EngineTrezorProvider
import { modalAlert, modalConfirmation } from '/imports/modal';
import { Template } from 'meteor/templating';
import { saveAs } from 'file-saver';
import { Buffer } from 'buffer';
import ETHWallet from 'ethereumjs-wallet';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { TAPi18n } from 'meteor/tap:i18n';
import { Router } from 'meteor/iron:router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.Wallet.events({
    'click #metamaskWalet': () => {
        const _wrapperElem = $('.wallet-way-wrapper');

        _wrapperElem.addClass('loading');
    
        if (!_.isUndefined(window.web3_previous)
        && !_.isUndefined(window.web3_previous.currentProvider)
        && !_.isUndefined(window.web3_previous.currentProvider.isMetaMask)) {
            window.web3 = window.web3_previous;
        }
        if (!_.isUndefined(window.web3)
        && !_.isUndefined(window.web3.currentProvider)
        && !_.isUndefined(window.web3.currentProvider.isMetaMask)) {
            if (window.ethereum) {
                window.ethereum.enable().then(() => {
                    signatureAuth(function(error) {
                        if (error) {
                            _wrapperElem.removeClass('loading');
                            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.message));
                            return false;
                        }
                        _wrapperElem.removeClass('loading');
                        Session.set('walletWay', 'metamask');
                        Session.set('walletAddress', window.web3.eth.defaultAccount);
                        Session.set('broadcast', new Date().getTime());
                        Router.go(Session.get('previousLocationPath') && Session.get('previousLocationPath') != null ? Session.get('previousLocationPath') : '/');
                        return null;
                    });
                }).catch(() => {
                    _wrapperElem.removeClass('loading');
                    modalAlert(TAPi18n.__('Oops, something happenedps'), TAPi18n.__('Please unlock your Metamask extension'));
                });
            } else {
                if (_.isUndefined(window.web3.eth.defaultAccount)) {
                    _wrapperElem.removeClass('loading');
                    modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('Please unlock your Metamask extension'));
                    return false;
                }
           
                signatureAuth(function(error) {
                    if (error) {
                        _wrapperElem.removeClass('loading');
                        modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                        return false;
                    }
                    _wrapperElem.removeClass('loading');
                    Session.set('walletWay', 'metamask');
                    Session.set('walletAddress', window.web3.eth.defaultAccount);
                    Session.set('broadcast', new Date().getTime());
                    Router.go(Session.get('previousLocationPath') && Session.get('previousLocationPath') != null ? Session.get('previousLocationPath') : '/');
                    return null;
                });
            }
        } else {
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('We cannot detect Metamask extension in your browser'));
            _wrapperElem.removeClass('loading');
        }

        return false;
    },
    'click #createWalet': () => {
        Session.set('walletWay', 'createWalet');
        Router.go('CreateWallet');
        return false;
    },
    /*
  'click #ledgerWalet': () => {
    generateWeb3EngineLedgerProvider((error, result) => {
      if(error) {
        modalAlert(TAPi18n.__("Oops!"), TAPi18n.__(error.reason));
        return false;
      }
      if (web3.eth.defaultAccount) {
        signatureAuth(function(error, result) {
          if(error) {
            modalAlert(TAPi18n.__("Oops!"), TAPi18n.__(error.reason));
            return false;
          }
          Session.set("walletWay", "ledgerWalet");
          Session.set('broadcast', new Date().getTime());
          Router.go(Session.get("previousLocationPath") && Session.get("previousLocationPath") != null? Session.get("previousLocationPath"): '/');
        });
      } else {
        modalAlert(TAPi18n.__("Oops!"), TAPi18n.__("We can't detect unlocked device"));
      }
    });
    return false;
  },
  /*
  /*
  'click #trezorWalet': () => {
    generateWeb3EngineTrezorProvider((error, result) => {
      if(error) {
        modalAlert(TAPi18n.__("Oops!"), TAPi18n.__(error.reason));
        return false;
      }
      if (web3.eth.defaultAccount) {
        signatureAuth(function(error, result) {
          if(error) {
            modalAlert(TAPi18n.__("Oops!"), TAPi18n.__(error.reason));
            return false;
          }
          Session.set("walletWay", "trezorWalet");
          Session.set('broadcast', new Date().getTime());
          Router.go(Session.get("previousLocationPath") && Session.get("previousLocationPath") != null? Session.get("previousLocationPath"): '/');
        });
      } else {
        modalAlert(TAPi18n.__("Oops!"), TAPi18n.__("We can't detect unlocked device"));
      }
    });
    return false;
  },
  */
    'click #unlockWalet': () => {
        Session.set('walletWay', 'unlockWalet');
        Router.go('UnlockWallet');
        return false;
    },
});

Template.UnlockWallet.events({
    'click #toogleUnlockWalletPassword': (event) => {
        if ($('#unlockWalletPassword').attr('type') == 'text') {
            $(event.currentTarget).text(TAPi18n.__('Show'));
            $('#unlockWalletPassword').attr('type', 'password');
        } else {
            $(event.currentTarget).text(TAPi18n.__('Hide'));
            $('#unlockWalletPassword').attr('type', 'text');
        }
    },
    'click #unlockWallet': (event, templateInstance) => {
        $('#unlockWallet').attr('disabled', 'disabled');
        $('#unlockForm').addClass('loading');
        if (Meteor.isClient) {
            if (typeof (Worker) !== 'undefined') {
                let wallet_unlock_worker = new Worker('unlock-wallet.js');

                wallet_unlock_worker.postMessage(
                    {
                        json: templateInstance.find('#unlockWalletJson').value,
                        password: templateInstance.find('#unlockWalletPassword').value,
                    },
                );

                wallet_unlock_worker.addEventListener('message', function(event) {
                    if (!_.isUndefined(event.data.error)) {
                        unlockWallet(null, event.data.error, () => {
                            $('#unlockWallet').removeAttr('disabled');
                            $('#unlockForm').removeClass('loading');
                        });
                    } else {
                        unlockWallet(ETHWallet.fromPrivateKey(Buffer.from(event.data.privateKey)), null, () => {
                            $('#unlockWallet').removeAttr('disabled');
                            $('#unlockForm').removeClass('loading');
                        });
                    }
                    wallet_unlock_worker = null;
                }, false);

                wallet_unlock_worker.addEventListener('error', function(event) {
                    unlockWallet(null, event.message, () => {
                        $('#unlockWallet').removeAttr('disabled');
                        $('#unlockForm').removeClass('loading');
                    });
                    wallet_unlock_worker = null;
                }, false);
            }
        } else {
            // No Web Worker support..
            try {
                unlockWallet(ETHWallet.fromV3(templateInstance.find('#unlockWalletJson').value, templateInstance.find('#unlockWalletPassword').value), null, () => {
                    $('#unlockWallet').removeAttr('disabled');
                    $('#unlockForm').removeClass('loading');
                });
            } catch (e) {
                unlockWallet(null, e, () => {
                    $('#unlockWallet').removeAttr('disabled');
                    $('#unlockForm').removeClass('loading');
                });
            }
        }
    },
});

Template.CreateWallet.events({
    'click #generateRandomPassword': () => {
        $('#strongPassword').val(window.passwordGeneration.generate(15));
    },
    'click #createNewWallet': (event, templateInstance) => {
        if (String(templateInstance.find('#strongPassword').value).length < 9) {
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('PASS_9NUMBER'));
            return false;
        }
        const _elem = $('#createwallet');
        _elem.addClass('loading');
    
        modalConfirmation(TAPi18n.__('Warning!'), TAPi18n.__('Did you really save this password?'),
            () => {
                _elem.removeClass('loading');
                // just fail, don't do anything
            },
            () => {
                if (typeof (Worker) !== 'undefined') {
                    let wallet_worker = new Worker('generate-wallet.js');
                    wallet_worker.postMessage({ newPassword: templateInstance.find('#strongPassword').value });
    
                    wallet_worker.addEventListener('message', function(event) {
                        _elem.removeClass('loading');
                        generateNewWallet(ETHWallet.fromPrivateKey(Buffer.from(event.data.privateKey)), event.data.v3json);
                        wallet_worker = null;
                    });
          
                    wallet_worker.addEventListener('error', function(event) {
                        _elem.removeClass('loading');
                        modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(event.message));
                        wallet_worker = null;
                    }, false);
                } else {
                    // Sorry! No Web Worker support..
                    const personal_wallet = ETHWallet.generate();
                    const v3json = personal_wallet.toV3String(templateInstance.find('#strongPassword').value, { kdf: 'scrypt', n: '1024' });
                    generateNewWallet(personal_wallet, v3json);
                }
            });
        return false;
    },
    'click #downloadUTCJSON': () => {
        const addressString = ETHWallet.fromPrivateKey(Buffer.from(Session.get('personalWallet')._privKey)).getAddressString();
        const file = new window.File([Session.get('v3json')], `UTC/JSON (v3) for ${addressString}.txt`, { type: 'text/plain;charset=utf-8' });
        saveAs(file);
    },
    'click #printUTCJSON': () => {
        const printWindow = window.open('about:blank', TAPi18n.__('Print') + new Date().getTime(), 'left=50000,top=50000,width=0,height=0');
        printWindow.document.write(Session.get('v3json'));
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    },
    'click #copyAddress': (event, templateInstance) => {
        const copyText = templateInstance.find('#walletAddress');
        copyText.select();
        document.execCommand('copy');
        modalAlert(TAPi18n.__('Copied!'));
    },
    'click #signUp': () => {
        const _elem = $('#createwallet');
        _elem.addClass('loading');
        modalConfirmation(TAPi18n.__('Warning!'), TAPi18n.__('Did you really save UTC/JSON file?'),
            () => {
                _elem.removeClass('loading');
                // just fail, don't do anything
            },
            () => {
                generateWeb3WalletEngineProvider(ETHWallet.fromPrivateKey(Buffer.from(Session.get('personalWallet')._privKey)), () => {
                    signatureAuth(function(error) {
                        if (error) {
                            modalAlert(TAPi18n.__('Oops!'), TAPi18n.__(error.reason));
                            _elem.removeClass('loading');
                            return false;
                        }
                        _elem.removeClass('loading');
                        Session.set('broadcast', new Date().getTime());
                        Router.go(Session.get('previousLocationPath') && Session.get('previousLocationPath') != null ? Session.get('previousLocationPath') : '/');
                        return null;
                    });
                });
            });
  
        return false;
    },
});

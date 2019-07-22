import { modalAlert, modalConfirmation } from '/imports/modal';
import { TAPi18n } from 'meteor/tap:i18n';
import { $ } from 'meteor/jquery';
import { loadWeb3, signature } from '/imports/client/blockchain';
import { balance } from '/imports/collections';
import { _ } from 'meteor/underscore';
import { Router } from 'meteor/iron:router';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

const clientPrepareDeposit = function(symbol, _buttonEl) {
    Meteor.call('prepareDeposit', symbol, function (error, result) {
        // remove UI decoration
        _buttonEl.removeClass('loading');
        _buttonEl.removeAttr('disabled');
    
        if (error) {
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.message));
        } else {
            let sandboxWarning = '';
            if (!_.isUndefined(Meteor.settings.public.sandbox) && Meteor.settings.public.sandbox) {
                sandboxWarning = `
        <div class="ui ignored red message">
          <i class="icon info"></i>
          <b>${TAPi18n.__('Important')}</b>:
          ${TAPi18n.__('SANDBOX_MODE_DESC')}
        </div>`;
            }
            modalAlert(TAPi18n.__('Instruction'),
                `<div class="ui segment center aligned" >
        <div class="ui ignored orange message">
          <i class="icon info"></i>
          <b>${TAPi18n.__('Important')}</b>:
          ${TAPi18n.__('Send only <b>%s</b> to this deposit address on the main network. Sending any other coin or token to this address may result in the loss of your deposit.', symbol)}
        </div>

        ${sandboxWarning}
        
        <div class="ui form grid">
          <div class="field twelve wide column">
            <label>${TAPi18n.__('%s deposit address', symbol)}</label>
            <div class="ui action input">
              <input type="text" readonly id="depositAddress" value="${result.address}"/>
              <button id="copyDepositAddress" onClick="var copyText = $('#depositAddress').select(); document.execCommand('copy');" class="ui blue button">
                <i class="copy icon"></i>
              </button>
            </div>
          </div>
          <div class="field four wide column depositWrapper">
            <label>${TAPi18n.__('%s deposit QR code', symbol)}</label>
            <div class="depositQrCode"><img src="${result.qrcode}"></div>
          </div>
          <div class="field sixteen wide column trustedAddressWrapper">
            <label>${TAPi18n.__('%s trusted address', symbol)}</label>
            <div class="ui action input">
              <input type="text" readonly id="trustedAddress" value="${result.trustedAddress}"/>
              <button id="copyTrustedAddress" onClick="var copyText = $('#trustedAddress').select(); document.execCommand('copy');" class="ui blue button">
                <i class="copy icon"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="ui ignored grey message">
          <i class="icon info"></i>
          <b>${TAPi18n.__('Please note')}</b>:
          <ul>
            <li>${TAPi18n.__('DEPOSIT_TIME', Router.routes.Transactions._path)}</li>
            <li>${TAPi18n.__('DEPOSIT_LOOPBACK', result.trustedAddress)}</li>
          </ul>
        </div>
        
      </div>`);
        }
    });
};

Template.Balances.events({
    'keyup #balances_ProductSymbolSearch': (event) => {
        Session.set('balance_ProductSymbolSearch', $(event.currentTarget).val());
    },
    'click .withdraw': (event) => {
        const _buttonEl = $(event.currentTarget);
        const symbol = _buttonEl.attr('data-symbol');
    
        // add UI decoration
        _buttonEl.addClass('loading');
        _buttonEl.attr('disabled', 'disabled');
    
        const _userBalance = balance.findOne({ UserId: Meteor.userId() });
        if (!_.isUndefined(_userBalance) && !_.isUndefined(_userBalance.TrustedAddress)) {
            let sandboxWarning = '';
            if (!_.isUndefined(Meteor.settings.public.sandbox) && Meteor.settings.public.sandbox) {
                sandboxWarning = `
        <div class="ui ignored red message">
          <i class="icon info"></i>
          <b>${TAPi18n.__('Important')}</b>:
          ${TAPi18n.__("It is SANDBOX mode, this feature doesn't work in this mode in fully.")}
        </div>`;
            }
          
            modalConfirmation(TAPi18n.__('Instruction'),
                `<div class="ui segment center aligned" >
          ${sandboxWarning}
          
          <div class="ui form">
            <div class="ui error message">
              <div class="header">${TAPi18n.__('Wrong data')}</div>
              <p>${TAPi18n.__('You must specify amount in a assumed format.')}</p>
            </div>
            <div class="field">
              <label>${TAPi18n.__('%s withdraw address', symbol)}</label>
              <div class="ui action input">
                <input type="text" readonly id="withdrawAddress" value="${_userBalance.TrustedAddress}"/>
              </div>
            </div>
            <div class="field">
              <label>${TAPi18n.__('%s withdraw amount. Max is %s %s', { sprintf: [symbol, _userBalance.Balance.toString(), symbol] })}</label>
              <div class="ui action input">
                <input type="text" class="decimal" id="withdrawAmount"/>
                <button id="allAmount" onClick="$('#withdrawAmount').val('${_userBalance.Balance.toString()}');" data-symbol="${symbol}" class="ui blue button">
                  ${TAPi18n.__('Maximum')}
                </button>
              </div>
            </div>
          </div>
          
          <div class="ui ignored grey message">
            <i class="icon info"></i>
            <b>${TAPi18n.__('Please note')}</b>:
            <ul>
              <li>${TAPi18n.__('The asset will be sent to your trusted address %s after consideration from our security team', _userBalance.TrustedAddress)}</li>
              <li>${TAPi18n.__('Each withdrawal transaction must be signed by your private key.')}</li>
            </ul>
          </div>
        </div>`,
                function() {
                    _buttonEl.removeClass('loading');
                    _buttonEl.removeAttr('disabled');
                    return null;
                },
                function() {
                    const _this = this;
                    if (!Number($('#withdrawAmount', _this).val()).valueOf()
                        || Number($('#withdrawAmount', _this).val()).valueOf() === 0
                        || $('#withdrawAddress', _this).val() == '') {
                        $('.ui.form', _this).addClass('error');
                        setTimeout(function() {
                            $('.ui.form', _this).removeClass('error');
                        }, 4000);
                        return false;
                    }
                    loadWeb3(function () {
                        signature(`Withdrawal operation for ${$('#withdrawAmount', _this).val()} amount on ${_userBalance.TrustedAddress} address`,
                            function(error, signature) {
                                if (error) {
                                    // remove UI decoration
                                    _buttonEl.removeClass('loading');
                                    _buttonEl.removeAttr('disabled');
                    
                                    modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.message));
                                    return false;
                                }
  
                                Meteor.call('prepareWithdraw',
                                    symbol,
                                    _userBalance.TrustedAddress,
                                    Number($('#withdrawAmount', _this).val()).valueOf(),
                                    signature,
                                    function (error) {
                                        // remove UI decoration
                                        _buttonEl.removeClass('loading');
                                        _buttonEl.removeAttr('disabled');
                    
                                        if (error) {
                                            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.message));
                                        } else {
                                            modalAlert(TAPi18n.__('Success'), TAPi18n.__('Your request on withdraw operation is accepted.'));
                                        }
                                    });
                                return false;
                            });
                    });
                    return null;
                },
                'Decline',
                'Withdraw');
        } else {
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('Your trusted address for %s is epmty. Click on deposit to fill it.', symbol));
        }
        return false;
    },
    'click .deposit': (event) => {
        const _buttonEl = $(event.currentTarget);
        const symbol = _buttonEl.attr('data-symbol');
    
        // add UI decoration
        _buttonEl.addClass('loading');
        _buttonEl.attr('disabled', 'disabled');
    
        if (_.isUndefined(balance.findOne({ UserId: Meteor.userId(), ProductSymbol: symbol })) || _.isUndefined(balance.findOne({ UserId: Meteor.userId(), ProductSymbol: symbol }).TrustedAddress)) {
            let sandboxWarning = '';
            if (!_.isUndefined(Meteor.settings.public.sandbox) && Meteor.settings.public.sandbox) {
                sandboxWarning = `
        <div class="ui ignored red message">
          <i class="icon info"></i>
          <b>${TAPi18n.__('Important')}</b>:
          ${TAPi18n.__('SANDBOX_MODE_DESC')}
        </div>`;
            }
            modalConfirmation(TAPi18n.__('Instruction'),
                `<div class="ui segment center aligned" >
          <div class="ui ignored orange message">
            <i class="icon info"></i>
            <b>${TAPi18n.__('Important')}</b>:
            ${TAPi18n.__('CAREFUL_TRUSTED_ADDRESS')}
            <b>${TAPi18n.__("You won't be able to change this address for %s. All withdraw operation for %s will be performed this address", { sprintf: [symbol, symbol] })}</b>
          </div>
    
          ${sandboxWarning}
          
          <div class="ui form">
            <div class="ui error message">
              <div class="header">${TAPi18n.__('Wrong data')}</div>
              <p>${TAPi18n.__('You must specify address in a assumed format.')}</p>
            </div>
            <div class="field">
              <label>${TAPi18n.__('%s trusted address', symbol)}</label>
              <div class="ui action input">
                <input type="text" id="trustedAddress"/>
              </div>
            </div>
          </div>
          
          <div class="ui ignored grey message">
            <i class="icon info"></i>
            <b>${TAPi18n.__('Please note')}</b>:
            <ul>
              <li>${TAPi18n.__("This address will be used for deposit and withdraw operations. After setting up you won't be able to change it.")}</li>
            </ul>
          </div>
        </div>`,
                function() {
                    _buttonEl.removeClass('loading');
                    _buttonEl.removeAttr('disabled');
                },
                function() {
                    const _this = this;
                    if ($('#trustedAddress', _this).val() == '') {
                        $('.ui.form', _this).addClass('error');
                        setTimeout(function() {
                            $('.ui.form', _this).removeClass('error');
                        }, 4000);
                        return false;
                    }
          
                    Meteor.call('setTrustedAddress', symbol, $('#trustedAddress', _this).val(),
                        function (error) {
                            // remove UI decoration
                            _buttonEl.removeClass('loading');
                            _buttonEl.removeAttr('disabled');
              
                            if (error) {
                                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.message));
                            } else {
                                clientPrepareDeposit(symbol, _buttonEl);
                            }
                        });
                    return null;
                },
                'Decline',
                'Set up');
        } else {
            clientPrepareDeposit(symbol, _buttonEl);
        }
        return false;
    },
});

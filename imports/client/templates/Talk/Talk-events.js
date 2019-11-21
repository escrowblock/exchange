import { encryptMessage, decryptMessage } from '/imports/cryptoTalkTools';
import cryptoMsg from 'meteor/escb:web3-crypto-message';
import { modalAlert, modalConfirmation } from '/imports/modal';
import { TAPi18n } from 'meteor/tap:i18n';
import { user_files, talk, trade } from '/imports/collections';
import { $ } from 'meteor/jquery';
import { saveAs } from 'file-saver';
import pako from 'pako';
import { _ } from 'meteor/underscore';
import { loadWeb3, signature } from '/imports/client/blockchain';
import { Router } from 'meteor/iron:router';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

Template.Talk.events({
    'click #attachFileToTalk'() {
        $('#fileInput')[0].click();
    },
    'touchend #attachFileToTalk'() {
        $('#fileInput')[0].click();
    },
    'touchmove #attachFileToTalk'() {
        $('#fileInput')[0].click();
    },
    'click .ipfs'(event) {
        const target = $(event.currentTarget);
        target.find('.icon').addClass('loading');
        try {
            window.fetch(target.attr('href')).then(response => response.text()).then((data) => {
                const source = decryptMessage(data, Session.get(`channelIdentity${$('#talk_id').val()}`));
                const result = pako.inflate(Buffer.from(source, 'hex'));
                
                let content_type = target.attr('data-type');
                switch (content_type) {
                case 'text/plain':
                case 'text/html':
                    content_type = `${content_type}; charset=utf-8`;
                    break;
                default:
                    break;
                }

                const file = new window.File([result], target.attr('data-name'), { type: content_type });
                saveAs(file);
                
                target.find('.icon').removeClass('loading');
            }).reject(() => {
                target.find('.icon').removeClass('loading');
            });
        } catch (e) {
            target.find('.icon').removeClass('loading');
        }
        return false;
    },
    'keyup textarea'(event) {
        const textarea = event.currentTarget;
        const currentCounter = String($(textarea).val()).length;
        if (currentCounter > Template.instance().maxCounter) {
            event.preventDefault();
            return false;
        }
        $(textarea).height(0);
        $(textarea).height(textarea.scrollHeight);
        $('.talks .scroll-pane').css({ height: Number($(window).height()).valueOf() - Number($('#bodyMessage')[0].scrollHeight).valueOf() - 100 });
        $('#bodyMessageCounter').text(`${currentCounter}/${Template.instance().maxCounter}`);
        return false;
    },
    'click #sendMessage'() {
        const message = $('#bodyMessage').val();
        const uploadFiles = Session.get('userFiles');
        let message_files = [];
        if (message.length > Template.instance().maxCounter) {
            modalAlert(TAPi18n.__('Oops'), TAPi18n.__('You should type a message not more than %s chars_', Template.instance().maxCounter));
            return false;
        }
        if (message || (!_.isUndefined(uploadFiles) && uploadFiles.length)) {
            $('#bodyMessage').val('');
            $('#bodyMessageCounter').text(`0/${Template.instance().maxCounter}`);
            if (!_.isUndefined(uploadFiles)) {
                message_files = _.map(uploadFiles, function(obj) {
                    const schema_object = {};
                    schema_object.Name = obj.name;
                    schema_object.Extension = obj.extension;
                    schema_object.Type = obj.type;
                    schema_object._id = obj._id;
                    schema_object.UserId = obj.userId;
                    schema_object.Link = user_files.findOne(obj._id).link();
                    return schema_object;
                });
            }
            
            const encryptedMessage = message ? encryptMessage(message, Session.get(`channelIdentity${$('#talk_id').val()}`)) : '';
            
            const _message_object = { Message: encryptedMessage, Files: message_files, TalkId: $('#talk_id').val() };
            
            $('#sendMessageForm').addClass('loading');
            Meteor.call('sendMessageToTalk', _message_object, Session.get('currentInstance'), function(error) {
                $('#sendMessageForm').removeClass('loading');
                if (error) {
                    console.log(error);
                }
                const height = $('.talks .ui.feed').outerHeight();
                $('.talks').stop().animate({ scrollTop: height }, '500', 'swing');
                window.globalDict.set('uploadFiles', new ReactiveVar([]));
                Session.set('userFiles', []);
            });
        } else {
            modalAlert(TAPi18n.__('Oops'), TAPi18n.__('You should type a message or attach a file_'));
        }
        return false;
    },
    'click #confirmTrade'(event) {
        modalConfirmation(TAPi18n.__('Trade confirmation'), TAPi18n.__('TRADE_CONFIRMATION_DESC'),
            function() {
                // just fail, don't do anything
            },
            function() {
                const _elem = $(event.currentTarget);
                _elem.attr('disabled', 'disabled').addClass('loading');
                Meteor.call('confirmTrade', $('#talk_id').val(), function(error) {
                    _elem.removeAttr('disabled').removeClass('loading');
                    if (error) {
                        modalAlert(TAPi18n.__('Oops'), TAPi18n.__(error.reason));
                        return false;
                    }
                    Router.go('/trade');
                    return null;
                });
            });
    },
    'click #refuseTrade'(event) {
        modalConfirmation(TAPi18n.__('Trade refusing'), TAPi18n.__('TRADE_REFUSE_DESC'),
            function() {
                // just fail, don't do anything
            },
            function() {
                const _elem = $(event.currentTarget);
                _elem.attr('disabled', 'disabled').addClass('loading');
                Meteor.call('refuseTrade', $('#talk_id').val(), function(error) {
                    _elem.removeAttr('disabled').removeClass('loading');
                    if (error) {
                        modalAlert(TAPi18n.__('Oops'), TAPi18n.__(error.reason));
                        return false;
                    }
                    Router.go('/trade');
                    return null;
                });
            });
    },
    'click #callArbitration'(event) {
        modalConfirmation(TAPi18n.__('Call for arbitration'), TAPi18n.__('CALL_ARBITRATION_DESC'),
            function() {
                // just fail, don't do anything
            },
            function() {
                const _elem = $(event.currentTarget);
                const _talkId = $('#talk_id').val();
                _elem.attr('disabled', 'disabled').addClass('loading');

                Meteor.call('getEncryptionPublicKeyArbitration', _talkId, function(error, result) {
                    if (error) {
                        _elem.removeAttr('disabled').removeClass('loading');
                        modalAlert(TAPi18n.__('Oops'), TAPi18n.__(error.reason));
                        return false;
                    }
                    const channelIdentity = Session.get(`channelIdentity${_talkId}`);
                    const EncryptedMessageForArbitration = cryptoMsg.encryptWithPublicKey(
                        result.EncryptionPublicKey,
                        EJSON.stringify(channelIdentity),
                    );

                    Meteor.call('callArbitration', _talkId, result.ArbitrationUserId, EncryptedMessageForArbitration, function(error) {
                        _elem.removeAttr('disabled').removeClass('loading');
                        if (error) {
                            modalAlert(TAPi18n.__('Oops'), TAPi18n.__(error.reason));
                            return false;
                        }
                        modalAlert(TAPi18n.__('Your request has been sent'), TAPi18n.__('After this moment the trade is in the disputed status'));
                        return null;
                    });
                    return null;
                });
            });
    },
    'click #resolveDispute'(event) {
        let sandboxWarning = '';
        if (!_.isUndefined(Meteor.settings.public.sandbox) && Meteor.settings.public.sandbox) {
            sandboxWarning = `
        <div class="ui ignored red message">
          <i class="icon info"></i>
          <b>${TAPi18n.__('Important')}</b>:
          ${TAPi18n.__("It is SANDBOX mode, this feature doesn't work in this mode in fully_")}
        </div>`;
        }
        const _talkId = $('#talk_id').val();

        const _trade = trade.findOne({ ExecutionId: talk.findOne({ _id: _talkId, ArbitrationId: Meteor.userId() }).ReferenceId });

        if (_.isUndefined(_trade)) {
            return false;
        }

        const _elem = $(event.currentTarget);
        _elem.attr('disabled', 'disabled').addClass('loading');
          
        const _product = String(_trade.InstrumentSymbol).split('_');

        const productSymbol = _product[0];
        const maxAmount = _trade.Quantity.toString();

        modalConfirmation(TAPi18n.__('Resolve this disput'),
            `<div class="ui segment center aligned" >
      ${sandboxWarning}
      
      <div class="ui form">
        <div class="ui error message">
          <div class="header">${TAPi18n.__('Wrong data')}</div>
          <p>${TAPi18n.__('You must specify amount in a assumed format.')}</p>
        </div>
        <div class="header">${TAPi18n.__('Do you really want to resolve this arbitration?')}</div>
        <div class="field">
          <label>${TAPi18n.__('%s approved amount_ Maximum is %s %s', { sprintf: [productSymbol, maxAmount, productSymbol] })}</label>
          <div class="ui action input">
            <input type="text" data-symbol="${productSymbol}" class="decimal" id="approvedAmount"/>
            <button id="allAmount" onClick="$('#approvedAmount').val('${maxAmount}');" data-symbol="${productSymbol}" class="ui blue button">
              ${TAPi18n.__('Maximum')}
            </button>
          </div>
        </div>
      </div>
      <div class="ui ignored grey message">
        <i class="icon info"></i>
        <b>${TAPi18n.__('Please note')}</b>:
        <ul>
          <li>${TAPi18n.__('APPROVED_AMOUNT_ESCROW')}</li>
          <li>${TAPi18n.__('You will sign your decision and will should to prove your logic if it will be required_')}</li>
        </ul>
      </div>
    </div>`,
            function() {
                // remove UI decoration
                _elem.removeAttr('disabled').removeClass('loading');
            },
            function() {
                const _this = this;
                const _amountElem = $('#approvedAmount', _this);
                if (!Number(_amountElem.val()).valueOf() || _amountElem.val() == '' || Number(_amountElem.val()).valueOf() > _trade.Quantity.toNumber()) {
                    $('.ui.form', _this).addClass('error');
                    setTimeout(function() {
                        $('.ui.form', _this).removeClass('error');
                    }, 4000);
                    return false;
                }
                loadWeb3(function () {
                    signature(`Resolve disput for ${_talkId} with approve amount ${_amountElem.val()} ${_amountElem.attr('data-symbol')}`,
                        function(error, signature) {
                            if (error) {
                                // remove UI decoration
                                _elem.removeAttr('disabled').removeClass('loading');
  
                                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.message));
                                return false;
                            }

                            Meteor.call('resolveDispute', _talkId, Number(_amountElem.val()).valueOf(), _amountElem.attr('data-symbol'), signature, function(error) {
                                // remove UI decoration
                                _elem.removeAttr('disabled').removeClass('loading');
    
                                if (error) {
                                    modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.message));
                                } else {
                                    Router.go('/trade');
                                }
                            });
                            return null;
                        });
                    return null;
                });
                return null;
            },
            'Decline',
            'Resolve');
        return false;
    },
});

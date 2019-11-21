import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { modalAlert } from '/imports/modal';
import { TAPi18n } from 'meteor/tap:i18n';
import { _ } from 'meteor/underscore';
import { Session } from 'meteor/session';

Template.Talk.onRendered(function () {
    if (this.data && this.data.Talk) {
        Meteor.call('setReadMessage', this.data.Talk._id);
    }
  
    const feed = this.find('.talks .scroll-pane .feed');

    if (feed) {
        $('.talks .scroll-pane').css({ height: Number($(window).height()).valueOf() - Number($('#bodyMessage')[0].scrollHeight).valueOf() - 150 });
        const pane = $('.talks .scroll-pane');
        pane.jScrollPane({ showArrows: true, autoReinitialise: true });
        pane.data('jsp').reinitialise();
        pane.data('jsp').scrollToBottom();
        
        const contentPane = pane.data('jsp').getContentPane();
        contentPane.append(
            $('.talks .scroll-pane .feed')[0],
        );
    
        feed._uihooks = {
            insertElement (node, next) {
                $(node).insertBefore(next);
                setTimeout(function() {
                    const pane = $('.talks .scroll-pane');
                    pane.data('jsp').reinitialise();
                    pane.data('jsp').scrollToBottom();
                }, 1000);
        
                contentPane.append(
                    $('.talks .scroll-pane .feed')[0],
                );
            },
        };
    }
    
    const { data } = this;
    
    if (_.isUndefined(Session.get(`channelIdentity${data.Talk._id}`))) {
        console.log(data);
        const values = Object.values(data.Talk.Identity);
        for (let i = 0; i < values.length; i += 1) {
            if (values[i].UserId == Meteor.userId()) {
                window.web3.currentProvider.sendAsync({
                    jsonrpc: '2.0',
                    method: 'eth_decryptMessage',
                    params: [`0x${values[i].Body}`, window.web3.eth.defaultAccount],
                    from: window.web3.eth.defaultAccount,
                }, function(error, channelIdentity) {
                    if (!error) {
                        try {
                            Session.set(`channelIdentity${data.Talk._id}`, JSON.parse(channelIdentity.result));
                        } catch (err) {
                            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(err));
                        }
                    } else {
                        modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error));
                    }
                });
                break;
            }
        }
    }
});

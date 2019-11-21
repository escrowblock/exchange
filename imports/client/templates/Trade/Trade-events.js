import { modalAlert, modalConfirmation } from '/imports/modal';
import { TAPi18n } from 'meteor/tap:i18n';
import { $ } from 'meteor/jquery';
import { Decimal } from 'meteor/mongo-decimal';
import { _ } from 'meteor/underscore';
import { order, instrument } from '/imports/collections.js';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Decimal.set({ toExpPos: 20 });

Template.Trade.events({
    'click .bookrow': (event) => {
        let target;
        if (!$(event.target).hasClass('bookrow')) {
            target = $(event.target).closest('.bookrow');
        } else {
            target = $(event.target);
        }
        const tab = $('.OrderWrapper .tab.active');
        if (tab.find('.price').length) {
            tab.find('.price').val($(target).find('.CellPrice').attr('data')).keyup();
        }
        if (tab.find('.quantity').val() == '') {
            tab.find('.quantity').val($(target).find('.CellQuantity').attr('data')).keyup();
        }
    },
    'keypress .decimal, blur .decimal': (event) => {
        if ((_.indexOf(['Delete', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'], String(event.key).toString()) == -1
        && String(event.key).search(/\d/) == -1 && String(event.key).search(/\./) == -1)
        || (String(event.key).search(/\./) != -1 && $(event.currentTarget).val().indexOf('.') != -1)
        || (String(event.key).search(/\./) != -1 && $(event.currentTarget).val() == '')
        || (String(event.key).search(/\d|\./) == -1 && _.indexOf(['Delete', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'], String(event.key).toString()) == -1)
        ) {
            event.preventDefault();
        }
    },
    'keyup .ui.form input[name="LimitPrice"]': (event) => {
        const formEl = $(event.currentTarget).closest('.ui.form');
        let _quantity = $(formEl).find('input[name="Quantity"]').val();
        try {
            _quantity = Decimal(_quantity) || Decimal(1);
        } catch (error) {
            _quantity = Decimal(1);
        }
        let curVal = $(event.currentTarget).val();
        try {
            curVal = Decimal(curVal) || Decimal(1);
        } catch (error) {
            curVal = Decimal(1);
        }
        $(formEl).find('input[name="Total"]').val(
            curVal.times(_quantity).toString(),
        );
    },
    'keyup .ui.form input[name="Quantity"]': (event) => {
        const formEl = $(event.currentTarget).closest('.ui.form');
        let _limitPrice = $(formEl).find('input[name="LimitPrice"]').val();
        try {
            _limitPrice = Decimal(_limitPrice) || Decimal(1);
        } catch (error) {
            _limitPrice = Decimal(1);
        }
        let curVal = $(event.currentTarget).val();
        try {
            curVal = Decimal(curVal) || Decimal(1);
        } catch (error) {
            curVal = Decimal(1);
        }
        $(formEl).find('input[name="Total"]').val(
            curVal.times(_limitPrice).toString(),
        );
    },
    'click .traderow': (event) => {
        let target;
        if (!$(event.target).hasClass('traderow')) {
            target = $(event.target).closest('.traderow');
        } else {
            target = $(event.target);
        }
        const tab = $('.OrderWrapper .tab.active');
        if (tab.find('.price').length) {
            tab.find('.price').val($(target).find('.CellPrice').attr('data')).keyup();
        }
        if (tab.find('.quantity').val() == '') {
            tab.find('.quantity').val($(target).find('.CellQuantity').attr('data')).keyup();
        }
    },
    'click .balance-buy': () => {
        const _balance = $('.OrderWrapper .tab.active .balance-buy');
        const form = $('.OrderWrapper .tab.active .ui.form.buy');
        if (Number(_balance.attr('data-val')).valueOf()) {
            form.find("input[name='Quantity']").val(_balance.attr('data-val')).keyup();
        }
        return false;
    },
    'click .button-buy': () => {
        if (Meteor.userId() == null) {
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('You must be logged in to place order_'));
            return false;
        }
        const form = $('.OrderWrapper .tab.active .ui.form.buy');
        const order = {};
        let error = false;
        form.addClass('loading');
        form.find('input, select').each(function() {
            if ($(this).val() != '') {
                switch ($(this).attr('name')) {
                case 'StopPrice':
                case 'LimitPrice':
                case 'Quantity':
                case 'TrailingAmount':
                case 'LimitOffset':
                    order[$(this).attr('name')] = Decimal($(this).val()).toNumber();
                    break;
                default:
                    order[$(this).attr('name')] = $(this).val();
                    break;
                }
            } else {
                error = true;
            }
        });
        const { MinQuantity } = instrument.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        const { MaxQuantity } = instrument.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        if (Decimal(order.Quantity).lt(MinQuantity) || Decimal(order.Quantity).gt(MaxQuantity)) {
            form.removeClass('loading');
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('For instrument %s - minimum quantity is %s, maximum quantity is %s', { sprintf: [Session.get('currentInstrumentSymbol'), MinQuantity.toString(), MaxQuantity.toString()] }));
            return false;
        }
        // Prevent sending field for visual estimation
        delete order.Total;
        if (error) {
            form.removeClass('loading');
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('You need to fill all fields for this order'));
        } else {
            order.InstrumentSymbol = Session.get('currentInstrumentSymbol');
      
            modalConfirmation(TAPi18n.__('Add order'), TAPi18n.__('Do you really want to add this order?'),
                () => {
                    form.removeClass('loading');
                    // just fail, don't do anything
                },
                () => {
                    Meteor.call('addOrder', order, (error) => {
                        form.removeClass('loading');
                        if (error) {
                            if (error.error !== 404) {
                                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                            } else {
                                if (Session.get('walletWay') == 'metamask') {
                                    modalAlert(TAPi18n.__('Action required'), TAPi18n.__(error.reason));
                                }
                                window.web3.currentProvider.sendAsync({
                                    jsonrpc: '2.0',
                                    method: 'encryption_public_key',
                                    params: [window.web3.eth.defaultAccount],
                                    from: window.web3.eth.defaultAccount,
                                }, function(error, encryptionpublickey) {
                                    if (!error) {
                                        Meteor.call('setEncryptionPublicKey', encryptionpublickey.result, function (error) {
                                            if (error) {
                                                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                                            }
                                            Meteor.call('addOrder', order, (error) => {
                                                if (error) {
                                                    modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                                                }
                                                modalAlert(TAPi18n.__('Success'), TAPi18n.__('Your order is placed_'), 1000);
                                            });
                                            form.find('input[type!="hidden"]').each(function() {
                                                $(this).val('');
                                            });
                                        });
                                    }
                                });
                            }
                        } else {
                            modalAlert(TAPi18n.__('Success'), TAPi18n.__('Your order is placed_'), 1000);
                            form.find('input[type!="hidden"]').each(function() {
                                $(this).val('');
                            });
                        }
                    });
                });
        }
        return false;
    },
    'click .balance-sell': () => {
        const _balance = $('.OrderWrapper .tab.active .balance-sell');
        const form = $('.OrderWrapper .tab.active .ui.form.sell');
        if (Number(_balance.attr('data-val')).valueOf()) {
            form.find("input[name='Quantity']").val(_balance.attr('data-val')).keyup();
        }
        return false;
    },
    'click .button-sell': () => {
        if (Meteor.userId() == null) {
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('You must be logged in to place order_'));
            return false;
        }
        const form = $('.OrderWrapper .tab.active .ui.form.sell');
        form.addClass('loading');
        const order = {};
        let error = false;
        form.find('input, select').each(function() {
            if ($(this).val() != '') {
                order[$(this).attr('name')] = $(this).val();
            } else {
                error = true;
            }
        });
        const { MinQuantity } = instrument.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        const { MaxQuantity } = instrument.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        if (Decimal(order.Quantity).lt(MinQuantity) || Decimal(order.Quantity).gt(MaxQuantity)) {
            form.removeClass('loading');
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('For instrument %s - minimum quantity is %s, maximum quantity is %s', { sprintf: [Session.get('currentInstrumentSymbol'), MinQuantity.toString(), MaxQuantity.toString()] }));
            return false;
        }
        // Prevent sending field for visual estimation
        delete order.Total;
        if (error) {
            form.removeClass('loading');
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('You need to fill all fields for this order'));
        } else {
            order.InstrumentSymbol = Session.get('currentInstrumentSymbol');
      
            modalConfirmation(TAPi18n.__('Add order'), TAPi18n.__('Do you really want to add this order?'),
                () => {
                    form.removeClass('loading');
                    // just fail, don't do anything
                },
                () => {
                    Meteor.call('addOrder', order, (error) => {
                        form.removeClass('loading');
                        if (error) {
                            if (error.error !== 404) {
                                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                            } else {
                                if (Session.get('walletWay') == 'metamask') {
                                    modalAlert(TAPi18n.__('Action required'), TAPi18n.__(error.reason));
                                }
                                window.web3.currentProvider.sendAsync({
                                    jsonrpc: '2.0',
                                    method: 'encryption_public_key',
                                    params: [window.web3.eth.defaultAccount],
                                    from: window.web3.eth.defaultAccount,
                                }, function(error, encryptionpublickey) {
                                    if (!error) {
                                        Meteor.call('setEncryptionPublicKey', encryptionpublickey.result, function (error) {
                                            if (error) {
                                                modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                                            }
                                            Meteor.call('addOrder', order, (error) => {
                                                if (error) {
                                                    modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.reason));
                                                }
                                                modalAlert(TAPi18n.__('Success'), TAPi18n.__('Your order is placed_'), 1000);
                                            });
                                            form.find('input[type!="hidden"]').each(function() {
                                                $(this).val('');
                                            });
                                        });
                                    }
                                });
                            }
                        } else {
                            modalAlert(TAPi18n.__('Success'), TAPi18n.__('Your order is placed_'), 1000);
                            form.find('input[type!="hidden"]').each(function() {
                                $(this).val('');
                            });
                        }
                    });
                });
        }
        return false;
    },
    'click .button-edit-order': (event) => {
        let target;
        if (!$(event.target).hasClass('button-cancel-order')) {
            target = $(event.target).closest('.button-cancel-order');
        } else {
            target = $(event.target);
        }
        const OrderID = $(target).attr('data');
        if (OrderID) {
            const instanceOrder = order.findOne({ _id: OrderID });
            modalAlert(TAPi18n.__('Editing order'), instanceOrder.Quantity);
        }
    },
    'click .button-cancel-order': (event) => {
        let target;
        if (!$(event.target).hasClass('button-cancel-order')) {
            target = $(event.target).closest('.button-cancel-order');
        } else {
            target = $(event.target);
        }
        target.addClass('loading');
        const OrderID = $(target).attr('data');
        if (OrderID) {
            modalConfirmation(TAPi18n.__('Deleting order'), TAPi18n.__('Do you really want to delete this order?'),
                () => {
                    target.removeClass('loading');
                },
                () => {
                    Meteor.call('cancelOrder', OrderID, function(error) {
                        target.removeClass('loading');
                        if (!error) {
                            const { limitOrder } = Meteor.settings.public;
                            const page = Session.get('MyOpenOrdersPage') ? Session.get('MyOpenOrdersPage') : 0;
                            const total = order.find({ UserId: Meteor.userId(), OrderState: 'Working' }).count();
                            if ((page - 1) >= 0 && total < (page + 1) * limitOrder) {
                                Session.set('MyOpenOrdersPage', page - 1);
                            }
                        }
                    });
                });
        }
    },
    'click #cancelSell': (event) => {
        const button = $(event.target);
        button.addClass('loading');
        modalConfirmation(TAPi18n.__('Cancel all sell orders'), TAPi18n.__('Do you really want to cancel all sell orders?'),
            () => {
                button.removeClass('loading');
            },
            () => {
                Meteor.call('cancelOrderSell', function(error) {
                    button.removeClass('loading');
                    if (!error) {
                        const { limitOrder } = Meteor.settings.public;
                        const page = Session.get('MyOpenOrdersPage') ? Session.get('MyOpenOrdersPage') : 0;
                        const total = order.find({ UserId: Meteor.userId(), OrderState: 'Working' }).count();
                        if ((page - 1) >= 0 && total < (page + 1) * limitOrder) {
                            Session.set('MyOpenOrdersPage', page - 1);
                        }
                    }
                });
            });
    },
    'click #cancelBuy': (event) => {
        const button = $(event.target);
        button.addClass('loading');
        modalConfirmation(TAPi18n.__('Cancel all buy orders'), TAPi18n.__('Do you really want to cancel all buy orders?'),
            () => {
                button.removeClass('loading');
            },
            () => {
                Meteor.call('cancelOrderBuy', function(error) {
                    button.removeClass('loading');
                    if (!error) {
                        const { limitOrder } = Meteor.settings.public;
                        const page = Session.get('MyOpenOrdersPage') ? Session.get('MyOpenOrdersPage') : 0;
                        const total = order.find({ UserId: Meteor.userId(), OrderState: 'Working' }).count();
                        if ((page - 1) >= 0 && total < (page + 1) * limitOrder) {
                            Session.set('MyOpenOrdersPage', page - 1);
                        }
                    }
                });
            });
    },
    'click #cancelAll': (event) => {
        const button = $(event.target);
        button.addClass('loading');
        modalConfirmation(TAPi18n.__('Cancel all orders'), TAPi18n.__('Do you really want to cancel all orders?'),
            () => {
                button.removeClass('loading');
            },
            () => {
                Meteor.call('cancelOrderAll', function(error) {
                    button.removeClass('loading');
                    if (!error) {
                        const { limitOrder } = Meteor.settings.public;
                        const page = Session.get('MyOpenOrdersPage') ? Session.get('MyOpenOrdersPage') : 0;
                        const total = order.find({ UserId: Meteor.userId(), OrderState: 'Working' }).count();
                        if ((page - 1) >= 0 && total < (page + 1) * limitOrder) {
                            Session.set('MyOpenOrdersPage', page - 1);
                        }
                    }
                });
            });
    },
    'click .my-open-orders-count-left': () => {
        const page = Session.get('MyOpenOrdersPage') ? Session.get('MyOpenOrdersPage') : 0;
        if (page - 1 >= 0) {
            Session.set('MyOpenOrdersPage', page - 1);
        }
    },
    'click .my-open-orders-count-right': () => {
        const { limitOrder } = Meteor.settings.public;
        const page = Session.get('MyOpenOrdersPage') ? Session.get('MyOpenOrdersPage') : 0;
        const total = order.find({ UserId: Meteor.userId(), OrderState: 'Working' }).count();
        if (total > (page + 1) * limitOrder) {
            Session.set('MyOpenOrdersPage', page + 1);
        }
    },
    'click .my-orders-history-count-left': () => {
        const page = Session.get('MyOrdersHistoryPage') ? Session.get('MyOrdersHistoryPage') : 0;
        if (page - 1 >= 0) {
            Session.set('MyOrdersHistoryPage', page - 1);
        }
    },
    'click .my-orders-history-count-right': () => {
        const { limitOrder } = Meteor.settings.public;
        const page = Session.get('MyOrdersHistoryPage') ? Session.get('MyOrdersHistoryPage') : 0;
        const total = order.find({ UserId: Meteor.userId(), OrderState: 'Working' }).count();
        if (total > (page + 1) * limitOrder) {
            Session.set('MyOrdersHistoryPage', page + 1);
        }
    },
    'change #chartPeriodMinutes': (event) => {
        Session.setPersistent('currentInterval', $(event.currentTarget).val());
    },
    'click #toCenter': () => {
        $('#bookTable').animate({ scrollTop: ($('#askRows').height() + $('#bidRows').height() + $('#bookSpread').height()) / 2 - 150 }, 200, 'linear');
    },
    'change #hidePairsTradesHistory': (event) => {
        Session.set('hidePairsTradesHistory', event.currentTarget.checked);
    },
    'change #hidePairsOrdersHistory': (event) => {
        Session.set('hidePairsOrdersHistory', event.currentTarget.checked);
    },
    'change #decimalNumber': (event) => {
        Session.setPersistent('currentInstrumentSymbolDecimal', event.currentTarget.value);
    },
    'click #buttonTradeFilter': () => {
        const from = new Date($('.tradeFilter input[name="From"]').val()).getTime();
        const to = new Date($('.tradeFilter input[name="To"]').val()).getTime();
        if (from) {
            Session.set('TradeFilterFrom', from);
        } else {
            Session.set('TradeFilterFrom', null);
        }
        if (to) {
            Session.set('TradeFilterTo', to);
        } else {
            Session.set('TradeFilterTo', null);
        }
        return false;
    },
});

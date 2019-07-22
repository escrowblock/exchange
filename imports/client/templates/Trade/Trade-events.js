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
        || !Number($(event.currentTarget).val()).valueOf()
        ) {
            event.preventDefault();
        }
    },
    'keyup .ui.form input[name="LimitPrice"]': (event) => {
        const formEl = $(event.currentTarget).closest('.ui.form');
        let _limitPrice = $(formEl).find('input[name="LimitPrice"]').val();
        _limitPrice = _limitPrice || 1;
        $(formEl).find('input[name="Total"]').val(
            Decimal($(event.currentTarget).val()).times(Decimal(_limitPrice)).toString(),
        );
    },
    'keyup .ui.form input[name="Quantity"]': (event) => {
        const formEl = $(event.currentTarget).closest('.ui.form');
        let _limitPrice = $(formEl).find('input[name="LimitPrice"]').val();
        _limitPrice = _limitPrice || 1;
        $(formEl).find('input[name="Total"]').val(
            Decimal($(event.currentTarget).val()).times(Decimal(_limitPrice)).toString(),
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
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('You must be logged in to place order.'));
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
        delete order.total;
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
                            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.message));
                        } else {
                            modalAlert(TAPi18n.__('Success'), TAPi18n.__('Your order is placed.'), 1000);
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
            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('You must be logged in to place order.'));
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
        delete order.total;
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
                            modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__(error.message));
                        } else {
                            modalAlert(TAPi18n.__('Success'), TAPi18n.__('Your order is placed.'), 1000);
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
        const OrderID = $(event.target).attr('data');
        if (OrderID) {
            const instanceOrder = order.findOne({ _id: OrderID });
            modalAlert(TAPi18n.__('Editing order'), instanceOrder.Quantity);
        }
    },
    'click .button-cancel-order': (event) => {
        const OrderID = $(event.target).attr('data');
        if (OrderID) {
            modalConfirmation(TAPi18n.__('Deleting order'), TAPi18n.__('Do you really want to delete this order?'),
                () => {
                    // just fail, don't do anything
                },
                () => {
                    Meteor.call('cancelOrder', OrderID, function(error) {
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
    'click #cancelSell': () => {
        modalConfirmation(TAPi18n.__('Cancel all sell orders'), TAPi18n.__('Do you really want to cancel all sell orders?'),
            () => {
                // just fail, don't do anything
            },
            () => {
                Meteor.call('cancelOrderSell', function(error) {
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
    'click #cancelBuy': () => {
        modalConfirmation(TAPi18n.__('Cancel all buy orders'), TAPi18n.__('Do you really want to cancel all buy orders?'),
            () => {
                // just fail, don't do anything
            },
            () => {
                Meteor.call('cancelOrderBuy', function(error) {
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
    'click #cancelAll': () => {
        modalConfirmation(TAPi18n.__('Cancel all orders'), TAPi18n.__('Do you really want to cancel all orders?'),
            () => {
                // just fail, don't do anything
            },
            () => {
                Meteor.call('cancelOrderAll', function(error) {
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

import { balance, product } from '/imports/collections';
import { _ } from 'meteor/underscore';
import { moment } from 'meteor/momentjs:moment';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.Balances.helpers({
    balance(ProductSymbol) {
        const _balance = balance.findOne({ UserId: Meteor.userId(), ProductSymbol });
        return !_.isUndefined(_balance) ? _balance.Balance : 0;
    },
    intrade(ProductSymbol) {
        const _balance = balance.findOne({ UserId: Meteor.userId(), ProductSymbol });
        return !_.isUndefined(_balance) ? _balance.InTrade : 0;
    },
    disabled(ProductSymbol, type) {
        const _product = product.findOne({ ProductSymbol });
        if (_.isUndefined(_product)) {
            return '';
        }
        switch (type) {
        case 'withdraw':
            if (!_.isUndefined(balance.findOne({ UserId: Meteor.userId(), ProductSymbol, Balance: { $gt: 0 } }))) {
                return _product.WithdrawStatus == 'Paused' ? 'disabled' : '';
            }
            return 'disabled';
            // break;
        case 'deposit':
            return _product.DepositStatus == 'Paused' ? 'disabled' : '';
            // break;
        default:
            break;
        }
        return '';
    },
    disabledDescripton(ProductSymbol) {
        const _product = product.findOne({ ProductSymbol });
        if (_.isUndefined(_product)) {
            return false;
        }
        if (_product.WithdrawStatus == 'Paused' || _product.DepositStatus == 'Paused') {
            return _product.StatusDescription;
        }
        return false;
    },
    products() {
        const searchStr = Session.get('balance_ProductSymbolSearch') ? Session.get('balance_ProductSymbolSearch') : '';
        return product.find({ ProductType: { $in: ['CryptoCurrency', 'Contract'] }, ProductSymbol: { $regex: searchStr, $options: 'i' } }, { sort: { ProductSymbol: 1 } });
    },
    timestamp(ProductSymbol) {
        const _balance = balance.findOne({ UserId: Meteor.userId(), ProductSymbol });
        return !_.isUndefined(_balance) ? moment(_balance.TimeStamp).format('Do MMM YYYY HH:mm:ss') : '-';
    },
});

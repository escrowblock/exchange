import { moment } from 'meteor/momentjs:moment';
import { transaction } from '/imports/collections';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

Template.Transactions.helpers({
    MyTransactions() {
        const { limitTransaction } = Meteor.settings.public;
        const UserId = Meteor.userId();
        return transaction.find({ UserId }, { sort: { TimeStamp: -1 }, limit: limitTransaction });
    },
    MyTransactionsCount() {
        const { limitTransaction } = Meteor.settings.public;
        const UserId = Meteor.userId();
        return transaction.find({ UserId }, { sort: { TimeStamp: -1 }, limit: limitTransaction }).count();
    },
    formatDate (date, format) {
        return moment(date).format(format);
    },
    notFirstPage () {
        return Session.get('MyTransactionsPage') ? Session.get('MyTransactionsPage') > 0 : false;
    },
});

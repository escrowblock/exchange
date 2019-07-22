import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.Transactions.events({
    'click .my-transactions-count-left': () => {
        const page = Session.get('MyTransactionsPage') ? Session.get('MyTransactionsPage') : 0;
        if (page - 1 >= 0) {
            Session.set('MyTransactionsPage', page - 1);
        }
    },
    'click .my-transactions-count-right': () => {
        const page = Session.get('MyTransactionsPage') ? Session.get('MyTransactionsPage') : 0;
        Session.set('MyTransactionsPage', page + 1);
    },
    'click #goToPreviousTransactionPage': () => {
        const page = Session.get('MyTransactionsPage') ? Session.get('MyTransactionsPage') : 0;
        Session.set('MyTransactionsPage', page - 1);
    },
});

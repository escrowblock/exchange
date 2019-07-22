import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.Transactions.onRendered(function () {
    $('table.transactions_product').tablesort();
  
    const transactions_ProductSymbolSearch = Session.get('transactions_ProductSymbolSearch');
    $('#transactions_ProductSymbolSearch').val(transactions_ProductSymbolSearch || '');
});

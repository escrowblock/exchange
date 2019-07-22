import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.Balances.onRendered(function () {
    $('table.balances_product').tablesort();
    $('#balance_ProductSymbolSearch').val(Session.get('balance_ProductSymbolSearch') || '');
});

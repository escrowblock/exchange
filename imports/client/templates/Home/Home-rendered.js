import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.Home.onRendered(function () {
    $('.ui.tabular.menu .item').tab();
    $('table.home_instrument').tablesort();
    $('#home_InstrumentSymbolSearch').val(Session.get('home_InstrumentSymbolSearch') || '');
});

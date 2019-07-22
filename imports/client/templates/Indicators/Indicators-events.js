import { $ } from 'meteor/jquery';
import { getCategoryByInstrumentSymbol } from '/imports/tools';
import Cookies from 'js-cookie';
import { price_24hr, instrument } from '/imports/collections';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.Indicators.events({
    'change #InstrumentSymbol': () => {
        if (document.location.pathname == '/trade') {
            document.location.hash = `#IS=${$('#InstrumentSymbol').val()}`;
        }
        Session.setPersistent('currentInstrumentSymbol', $('#InstrumentSymbol').val());
        Cookies.set('currentInstrumentSymbol', $('#InstrumentSymbol').val(), { expires: 3650 });
    },
    'click .changeTheme': () => {
        const themeMode = Session.get('themeMode') == 'moon' ? 'sun' : 'moon';
        Session.setPersistent('themeMode', themeMode);
        Cookies.set('themeMode', themeMode, { expires: 3650 });
    },
    'click .instrumentCategory': (event) => {
        $.tab('change tab', $(event.currentTarget).attr('data-tab'));
        $('.instrumentCategory').removeClass('active');
        $(event.currentTarget).addClass('active');
        Session.setPersistent('InstrumentCategory', $(event.currentTarget).attr('data-tab'));
        Session.setPersistent('homeInstrumentCategory', $(event.currentTarget).attr('data-tab'));
        Cookies.set('InstrumentCategory', $(event.currentTarget).attr('data-tab'), { expires: 3650 });
        // $('.instrumentSymbol div[data-tab="' + $(event.currentTarget).attr('data-tab') + '"] .scroll-pane').data('jsp').reinitialise();
    },
    'keyup #InstrumentSymbolSearch': (event) => {
        Session.setPersistent('InstrumentSymbolSearch', $(event.currentTarget).val());
        Cookies.set('InstrumentSymbolSearch', $(event.currentTarget).val(), { expires: 3650 });
    },
    'click .star': (event) => {
        if (!Meteor.userId()) {
            return false;
        }

        // we must update categories in the local collections after a changing
        const updateCategories = function(InstrumentSymbol) {
            const doc_instrument = instrument._collection.findOne({ InstrumentSymbol });
            const Category = getCategoryByInstrumentSymbol(doc_instrument, Meteor.userId(), doc_instrument.InstrumentSymbol);
      
            price_24hr._collection.update({ InstrumentSymbol }, { $set: { Category } });
            instrument._collection.update({ InstrumentSymbol }, { $set: { Category } });
        };
    
        const _instrumentsymbol = $(event.currentTarget).attr('data-instrumentsymbol');
        if (!$(event.currentTarget).hasClass('active')) {
            Meteor.call('addToFavorite', _instrumentsymbol, function() {
                updateCategories(_instrumentsymbol);
            });
        } else {
            Meteor.call('removeFromFavorite', _instrumentsymbol, function() {
                updateCategories(_instrumentsymbol);
            });
        }
        return null;
    },
});

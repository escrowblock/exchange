import { $ } from 'meteor/jquery';
import { getCategoryByInstrumentSymbol } from '/imports/tools';
import Cookies from 'js-cookie';
import { instrument, price_24hr } from '/imports/collections';
import { Router } from 'meteor/iron:router';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.Home.events({
    'keyup #home_InstrumentSymbolSearch': (event) => {
        Session.set('home_InstrumentSymbolSearch', $(event.currentTarget).val());
    },
    'click .home_instrumentCategory': (event) => {
        Session.setPersistent('homeInstrumentCategory', $(event.currentTarget).attr('data-tab').replace('home_', ''));
        Cookies.set('homeInstrumentCategory', $(event.currentTarget).attr('data-tab').replace('home_', ''), { expires: 3650 });
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
        return false;
    },
    'click .InstrumentSymbol': (event) => {
        Session.set('currentInstrumentSymbol', $(event.currentTarget).attr('data-instrument'));
        Cookies.set('currentInstrumentSymbol', $(event.currentTarget).attr('data-instrument'), { expires: 3650 });
        Router.go(`/trade#IS=${$(event.currentTarget).attr('data-instrument')}`);
    },
});

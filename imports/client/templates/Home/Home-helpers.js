import { getCategoryListInstrumentSymbol } from '/imports/tools';
import Cookies from 'js-cookie';
import { Decimal } from 'meteor/mongo-decimal';
import { price_24hr, instrument, profile } from '/imports/collections';
import { _ } from 'meteor/underscore';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.Home.helpers({
    active: (cat) => {
        let homeInstrumentCategory = Session.get('homeInstrumentCategory') ? Session.get('homeInstrumentCategory') : Cookies.get('homeInstrumentCategory');
        homeInstrumentCategory = !_.isUndefined(homeInstrumentCategory) ? homeInstrumentCategory : 'world';
        return cat == homeInstrumentCategory ? 'active' : '';
    },
    Categories: () => getCategoryListInstrumentSymbol(),
    PriceChange: (InstrumentSymbol, digits) => {
        const data = price_24hr.findOne({ InstrumentSymbol });
        return data ? Number(Decimal(data.PriceChange).toFixed(digits)).toLocaleString() : 0;
    },
    PriceChangePercent: (InstrumentSymbol, digits) => {
        const data = price_24hr.findOne({ InstrumentSymbol });
        return data ? Number(Decimal(data.PriceChangePercent).toFixed(digits)).toLocaleString() : 0;
    },
    AveragePrice: (InstrumentSymbol, digits) => {
        const data = price_24hr.findOne({ InstrumentSymbol });
        return data ? Number(Decimal(data.AveragePrice).toFixed(digits)).toLocaleString() : 0;
    },
    OpenPrice: (InstrumentSymbol, digits) => {
        const data = price_24hr.findOne({ InstrumentSymbol });
        return data ? Number(Decimal(data.OpenPrice).toFixed(digits)).toLocaleString() : 0;
    },
    LastPrice: (InstrumentSymbol, digits) => {
        const data = price_24hr.findOne({ InstrumentSymbol });
        return data ? Number(Decimal(data.LastPrice).toFixed(digits)).toLocaleString() : 0;
    },
    HighPrice: (InstrumentSymbol, digits) => {
        const data = price_24hr.findOne({ InstrumentSymbol });
        return data ? Number(Decimal(data.HighPrice).toFixed(digits)).toLocaleString() : 0;
    },
    LowPrice: (InstrumentSymbol, digits) => {
        const data = price_24hr.findOne({ InstrumentSymbol });
        return data ? Number(Decimal(data.LowPrice).toFixed(digits)).toLocaleString() : 0;
    },
    Volume: (InstrumentSymbol, digits) => {
        const data = price_24hr.findOne({ InstrumentSymbol });
        return data ? Number(Decimal(data.Volume).toFixed(digits)).toLocaleString() : 0;
    },
    QuoteVolume: (InstrumentSymbol, digits) => {
        const data = price_24hr.findOne({ InstrumentSymbol });
        return data ? Number(Decimal(data.QuoteVolume).toFixed(digits)).toLocaleString() : 0;
    },
    TradeCount: (InstrumentSymbol) => {
        const data = price_24hr.findOne({ InstrumentSymbol });
        return data ? data.TradeCount : 0;
    },
    instruments: (category) => {
        const searchStr = Session.get('home_InstrumentSymbolSearch') ? Session.get('home_InstrumentSymbolSearch') : '';
        return instrument.find({ Category: category, SessionStatus: 'Running', InstrumentSymbol: { $regex: searchStr, $options: 'i' } });
    },
    favorite: (InstrumentSymbol) => {
        const _profile = profile.findOne({ UserId: Meteor.userId() });
        return _profile && _profile.Favorite && _profile.Favorite.indexOf(InstrumentSymbol) != -1 ? 'active' : 'outline';
    },
});

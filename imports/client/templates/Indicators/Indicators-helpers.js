import { getCategoryListInstrumentSymbol } from '/imports/tools';
import { instrument, price_24hr, profile } from '/imports/collections';
import { moment } from 'meteor/momentjs:moment';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

Template.Indicators.helpers({
    Categories: () => getCategoryListInstrumentSymbol(),
    AvailableInstrument: (category) => {
        const searchStr = Session.get('InstrumentSymbolSearch') ? Session.get('InstrumentSymbolSearch') : '';
        if (instrument.find({ SessionStatus: 'Running', Category: category, InstrumentSymbol: { $regex: searchStr, $options: 'i' } }).count()) {
            return instrument.find({ SessionStatus: 'Running', Category: category, InstrumentSymbol: { $regex: searchStr, $options: 'i' } });
        }
        return instrument.find({ SessionStatus: 'Running', Category: category });
    },
    lastPrice: () => {
        const obj = price_24hr.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        return obj ? Number(obj.LastPrice).toFixed(2) : ' - ';
    },
    getLastPrice: (digits) => {
        const data = Template.currentData();
        const obj = price_24hr.findOne({ InstrumentSymbol: data.InstrumentSymbol });
        return obj ? Number(obj.LastPrice.toFixed(digits)).toLocaleString() : '*';
    },
    getPriceChangePercent: (digits) => {
        const data = Template.currentData();
        const obj = price_24hr.findOne({ InstrumentSymbol: data.InstrumentSymbol });
        return obj ? Number(obj.PriceChangePercent.toFixed(digits)).toLocaleString() : '*';
    },
    getQuoteVolume: (digits) => {
        const data = Template.currentData();
        const obj = price_24hr.findOne({ InstrumentSymbol: data.InstrumentSymbol });
        return obj ? Number(obj.QuoteVolume.toFixed(digits)).toLocaleString() : '*';
    },
    favorite: (InstrumentSymbol) => {
        const _profile = profile.findOne({ UserId: Meteor.userId() });
        return _profile && _profile.Favorite && _profile.Favorite.indexOf(InstrumentSymbol) != -1 ? 'active' : 'outline';
    },
    priceDirection: () => {
        const template = Template.instance();
        const obj = price_24hr.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        if (obj) {
            if (template.prevLastPrice && !obj.LastPrice.eq(template.prevLastPrice)) {
                return obj.LastPrice.gt(template.prevLastPrice) ? 'upTick' : 'downTick';
            }
            template.prevLastPrice = obj.LastPrice;
        }
        return '';
    },
    change24Value: () => {
        const obj = price_24hr.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        return obj ? obj.PriceChange.toFixed(2) : ' - ';
    },
    change24Percent: () => {
        const obj = price_24hr.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        return obj ? `(${obj.PriceChangePercent.toFixed(2)}%)` : '';
    },
    max24: () => {
        const obj = price_24hr.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        return obj ? obj.HighPrice.toFixed(2) : ' - ';
    },
    min24: () => {
        const obj = price_24hr.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        return obj ? obj.LowPrice.toFixed(2) : ' - ';
    },
    volume24: () => {
        const obj = price_24hr.findOne({ InstrumentSymbol: Session.get('currentInstrumentSymbol') });
        return obj ? obj.Volume.toFixed(2) : ' - ';
    },
    currentTime: () => moment(Session.get('currentTime')).format('YYYY-MM-DD HH:mm:ss'),
    themeMode: () => Session.get('themeMode'),
    
});

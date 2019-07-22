import { getCategoryByInstrumentSymbol } from '/imports/tools';
import {
    price_average, price_latest, instrument, price_24hr,
} from '/imports/collections';
import { moment } from 'meteor/momentjs:moment';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

Meteor.publish('PriceAverage', function(InstrumentSymbol) {
    check(InstrumentSymbol, String);
    return price_average.find({ InstrumentSymbol });
});

Meteor.publish('PriceLatest', function(InstrumentSymbol) {
    check(InstrumentSymbol, String);
    return price_latest.find({ InstrumentSymbol });
});

Meteor.publish('AvailableInstrument', function(InstrumentCategory) {
    check(InstrumentCategory, String);
    const self = this;
    const handle = instrument.find({ SessionStatus: 'Running' },
        {
            fields: {
                InstrumentSymbol: 1,
                SessionStatus: 1,
                Product1Symbol: 1,
                Product2Symbol: 1,
                QuantityIncrement: 1,
                MaxQuantity: 1,
                MinQuantity: 1,
            },
        })
        .observe({
            added(docArg) {
                const doc = docArg;
                doc.Category = getCategoryByInstrumentSymbol(doc, self.userId, doc.InstrumentSymbol);
                if (doc.Category == InstrumentCategory) {
                    self.added('instrument', doc._id, doc);
                }
            },
            changed(docArg) {
                const doc = docArg;
                doc.Category = getCategoryByInstrumentSymbol(doc, self.userId, doc.InstrumentSymbol);
                if (doc.Category == InstrumentCategory) {
                    self.changed('instrument', doc._id, doc);
                }
            },
            removed(doc) {
                self.removed('instrument', doc._id);
            },
        });

    self.ready();
    self.onStop(function () {
        handle.stop();
    });
});

Meteor.publish('Price24', function(InstrumentSymbol) {
    check(InstrumentSymbol, String);
    const openTime = moment.utc().subtract(1, 'd');
    return price_24hr.find({ InstrumentSymbol, CloseTime: { $gte: openTime.valueOf() } },
        {
            fields: {
                InstrumentSymbol: 1,
                PriceChange: 1,
                PriceChangePercent: 1,
                LastPrice: 1,
                Volume: 1,
                HighPrice: 1,
                LowPrice: 1,
                QuoteVolume: 1,
                AveragePrice: 1,
                OpenPrice: 1,
            },
        });
});

Meteor.publish('AllPrice24', function(InstrumentCategory) {
    check(InstrumentCategory, String);
    let symbols = [];
    const _instruments_obj = [];
    const _instruments = instrument.find({ SessionStatus: 'Running' }).fetch();
    symbols = _instruments.map((obj) => {
        _instruments_obj[obj.InstrumentSymbol] = obj;
        return obj.InstrumentSymbol;
    });

    const self = this;
    const openTime = moment.utc().subtract(1, 'd');
    const handle = price_24hr.find({ InstrumentSymbol: { $in: symbols }, CloseTime: { $gte: openTime.valueOf() } },
        {
            fields: {
                InstrumentSymbol: 1,
                PriceChange: 1,
                PriceChangePercent: 1,
                LastPrice: 1,
                Volume: 1,
                HighPrice: 1,
                LowPrice: 1,
                QuoteVolume: 1,
                AveragePrice: 1,
                OpenPrice: 1,
            },
        })
        .observe({
            added(docArg) {
                const doc = docArg;
                doc.Category = getCategoryByInstrumentSymbol(_instruments_obj[doc.InstrumentSymbol], self.userId, doc.InstrumentSymbol);
                if (doc.Category == InstrumentCategory) {
                    self.added('price_24hr', doc._id, doc);
                }
            },
            changed(docArg) {
                const doc = docArg;
                doc.Category = getCategoryByInstrumentSymbol(_instruments_obj[doc.InstrumentSymbol], self.userId, doc.InstrumentSymbol);
                if (doc.Category == InstrumentCategory) {
                    self.changed('price_24hr', doc._id, doc);
                }
            },
            removed(doc) {
                self.removed('price_24hr', doc._id);
            },
        });

    self.ready();
    self.onStop(function () {
        handle.stop();
    });
});

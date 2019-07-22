import { check } from 'meteor/check';
import Api from './config.js';
import { instrument } from '/imports/collections';

/**
 * Get instruments
 */
Api.addRoute('getinstruments',
    {
        authRequired: false,
        enableCors: true,
    },
    {
        get: {
            action() {
                return {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: instrument.find({},
                        {
                            fields: {
                                InstrumentSymbol: 1,
                                Product1Symbol: 1,
                                Product2Symbol: 1,
                                SessionStatus: 1,
                                PreviousSessionStatus: 1,
                                SessionStatusDateTime: 1,
                                QuantityIncrement: 1,
                                MaxQuantity: 1,
                                MinQuantity: 1,
                            },
                        }).fetch(),
                };
            },
        },
    });

/**
 * Get instrument
 */
Api.addRoute('getinstrument',
    {
        authRequired: false,
        enableCors: true,
    },
    {
        get: {
            action() {
                // string - The Symbol of the instrument.
                check(this.bodyParams.InstrumentSymbol, String);

                if (instrument.findOne({ InstrumentSymbol: this.bodyParams.InstrumentSymbol })) {
                    return {
                        status: 'success',
                        timestamp: new Date().getTime(),
                        data: instrument.find({ InstrumentSymbol: this.bodyParams.InstrumentSymbol },
                            {
                                fields: {
                                    InstrumentSymbol: 1,
                                    Product1Symbol: 1,
                                    Product2Symbol: 1,
                                    SessionStatus: 1,
                                    PreviousSessionStatus: 1,
                                    SessionStatusDateTime: 1,
                                    QuantityIncrement: 1,
                                    MaxQuantity: 1,
                                    MinQuantity: 1,
                                },
                            }).fetch(),
                    };
                }
                return {
                    status: 'error',
                    timestamp: new Date().getTime(),
                    message: 'Not found',
                };
            },
        },
    });

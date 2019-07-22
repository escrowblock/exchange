/* eslint no-underscore-dangle: ["error", { "allow": ["__global_roles__"] }] */

import Api from './config.js';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { transaction, profile, trade } from '/imports/collections';

/**
 * Get profile for current logged in user
 */
Api.addRoute('userprofile',
    {
        authRequired: true,
        enableCors: true,
    },
    {
        get: {
            action() {
                if (_.isEmpty(_.intersection(this.user.roles.__global_roles__, ['client']))) {
                    return {
                        statusCode: 403,
                        body: { status: 'error', timestamp: new Date().getTime(), message: 'You do not have permission to do this.' },
                    };
                }
                if (profile.findOne({ UserId: Meteor.userId() })) {
                    return {
                        status: 'success',
                        timestamp: new Date().getTime(),
                        data: profile.findOne({ UserId: Meteor.userId() },
                            {
                                fields: {
                                    UserId: 1,
                                    UserName: 1,
                                    Email: 1,
                                    CreatedAt: 1,
                                    UseOTP: 1,
                                    UseWhiteListIP: 1,
                                    Telegram: 1,
                                },
                            }),
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

/**
 * Get trades for current logged in user
 */
Api.addRoute('gettrades',
    {
        authRequired: true,
        enableCors: true,
    },
    {
        get: {
            action() {
                if (_.isEmpty(_.intersection(this.user.roles.__global_roles__, ['client']))) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            message: 'You do not have permission to do this.',
                        },
                    };
                }

                // integer - The starting index into the history of trades, from 0 (the most recent trade).
                this.bodyParams.StartIndex = Number(this.bodyParams.StartIndex).valueOf();
                check(this.bodyParams.StartIndex, Number);

                // integer - The number of trades to return. The system can return up to 200 trades.
                this.bodyParams.Counts = Number(this.bodyParams.Counts).valueOf();
                check(this.bodyParams.Counts, Number);

                if (this.bodyParams.Counts > 200) {
                    this.bodyParams.Counts = 200;
                }

                if (trade.findOne({ UserId: Meteor.userId() })) {
                    return {
                        status: 'success',
                        timestamp: new Date().getTime(),
                        data: trade.find({ UserId: Meteor.userId() },
                            {
                                limit: this.bodyParams.Counts,
                                skip: this.bodyParams.StartIndex,
                                fields: {
                                    Fee: 1,
                                    FeeProductSymbol: 1,
                                    ExecutionId: 1,
                                    TradeId: 1,
                                    OrderId: 1,
                                    ClientOrderId: 1,
                                    InstrumentId: 1,
                                    Side: 1,
                                    Quantity: 1,
                                    RemainingQuantity: 1,
                                    Price: 1,
                                    Value: 1,
                                    ExecutionTime: 1,
                                    TradeTime: 1,
                                    OrderTradeRevision: 1,
                                    Direction: 1,
                                    IsBlockTrade: 1,
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

/**
 * Get trades history for current logged in user
 */
Api.addRoute('gettradeshistory',
    {
        authRequired: true,
        enableCors: true,
    },
    {
        get: {
            action() {
                if (_.isEmpty(_.intersection(this.user.roles.__global_roles__, ['client']))) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            message: 'You do not have permission to do this.',
                        },
                    };
                }

                const params = { UserId: Meteor.userId() };

                // integer - The ID of the instrument whose history is reported. If no instrument ID is included,
                // the system returns trades for all instruments associated with the current profile.
                if (this.bodyParams.InstrumentId) {
                    this.bodyParams.InstrumentId = Number(this.bodyParams.InstrumentId).valueOf();
                    check(this.bodyParams.InstrumentId, Number);
                    params.InstrumentId = this.bodyParams.InstrumentId;
                }

                // integer - The ID of a specific trade. If specified, the call can return multiple states for a single trade.
                if (this.bodyParams.TradeId) {
                    this.bodyParams.TradeId = Number(this.bodyParams.TradeId).valueOf();
                    check(this.bodyParams.TradeId, Number);
                    params.TradeId = this.bodyParams.TradeId;
                }

                // string - The ID of the order resulting in the trade. If specified, the call returns all trades associated with the order.
                if (this.bodyParams.OrderId) {
                    this.bodyParams.OrderId = String(this.bodyParams.OrderId).valueOf();
                    check(this.bodyParams.OrderId, String);
                    params.OrderId = this.bodyParams.OrderId;
                }

                // integer - The historical date and time at which to begin the trade report, in milliseconds.
                if (this.bodyParams.StartTimeStamp) {
                    this.bodyParams.StartTimeStamp = Number(this.bodyParams.StartTimeStamp).valueOf();
                    check(this.bodyParams.StartTimeStamp, Number);
                    params.ReceiveTime = { $gte: this.bodyParams.StartTimeStamp };
                }

                // integer - Date at which to end the trade report, in milliseconds.
                if (this.bodyParams.EndTimeStamp) {
                    this.bodyParams.EndTimeStamp = Number(this.bodyParams.EndTimeStamp).valueOf();
                    check(this.bodyParams.EndTimeStamp, Number);
                    params.ReceiveTime = { $gte: this.bodyParams.EndTimeStamp };
                }

                // integer - In this case, the count of trades to return, counting from the `StartIndex`.
                // If not specified, returns all trades between `BeginTimeStamp` and `EndTimeStamp`, beginning at `StartIndex`.
                if (this.bodyParams.Depth) {
                    this.bodyParams.Depth = Number(this.bodyParams.Depth).valueOf();
                    check(this.bodyParams.Depth, Number);
                } else {
                    this.bodyParams.Depth = 0;
                }

                // integer - The starting index into the history of trades, from 0 (the most recent trade) and
                // moving backwards in time. If not specified, defaults to 0.
                if (this.bodyParams.StartIndex) {
                    this.bodyParams.StartIndex = Number(this.bodyParams.StartIndex).valueOf();
                    check(this.bodyParams.StartIndex, Number);
                    params.Index = { $gte: this.bodyParams.StartIndex };
                }

                // integer - The ID of the individual buy or sell execution. If not specified, returns all.
                if (this.bodyParams.ExecutionId) {
                    this.bodyParams.ExecutionId = Number(this.bodyParams.ExecutionId).valueOf();
                    check(this.bodyParams.ExecutionId, Number);
                    params.ExecutionId = this.bodyParams.ExecutionId;
                }

                if (trade.find(params, { fields: { _id: 1 } })) {
                    return {
                        status: 'success',
                        timestamp: new Date().getTime(),
                        data: trade.find(params,
                            {
                                limit: this.bodyParams.Counts,
                                skip: this.bodyParams.StartIndex,
                                fields: {
                                    Fee: 1,
                                    FeeProductSymbol: 1,
                                    ExecutionId: 1,
                                    TradeId: 1,
                                    OrderId: 1,
                                    ClientOrderId: 1,
                                    InstrumentId: 1,
                                    Side: 1,
                                    Quantity: 1,
                                    RemainingQuantity: 1,
                                    Price: 1,
                                    Value: 1,
                                    TradeTime: 1,
                                    ExecutionTime: 1,
                                    OrderTradeRevision: 1,
                                    Direction: 1,
                                    IsBlockTrade: 1,
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

/**
 * Get transactions for current logged in user
 */
Api.addRoute('gettransactions',
    {
        authRequired: true,
        enableCors: true,
    },
    {
        get: {
            /*
      * @params Depth - integer
      *     The number of transactions that will be returned, starting with the most recent transaction.
      */
            action() {
                if (_.isEmpty(_.intersection(this.user.roles.__global_roles__, ['client']))) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            message: 'You do not have permission to do this.',
                        },
                    };
                }
                this.bodyParams.Depth = Number(this.bodyParams.Depth).valueOf();
                check(this.bodyParams.Depth, Number);

                if (this.bodyParams.Depth > 1000) {
                    this.bodyParams.Depth = 1000;
                }

                if (transaction.findOne({ UserId: Meteor.userId() })) {
                    return {
                        status: 'success',
                        timestamp: new Date().getTime(),
                        data: transaction.find({ UserId: Meteor.userId() },
                            {
                                limit: this.bodyParams.Depth,
                                fields: {
                                    TransactionId: 1,
                                    Credit: 1,
                                    Debit: 1,
                                    TransactionType: 1,
                                    ReferenceId: 1,
                                    ReferenceType: 1,
                                    ProductSymbol: 1,
                                    Balance: 1,
                                    TimeStamp: 1,
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

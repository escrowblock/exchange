import { Decimal } from 'meteor/mongo-decimal';
import { _ } from 'meteor/underscore';
import { order } from '/imports/collections';
import { check } from 'meteor/check';
import { checkSigned, checkProtected } from './misc.js';
import Api from './config.js';

/**
 * Send order
 */
Api.addRoute('sendorder',
    {
        authRequired: true,
        enableCors: true,
    },
    {
        post: {
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
                
                if (checkSigned(this.bodyParams)) {
                    return {
                        statusCode: 9001,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'Old request. Method requires be SIGNED in the time frame.',
                        },
                    };
                }

                if (checkProtected(this.bodyParams, this.user._id)) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'The body signature is invalid. ',
                        },
                    };
                }

                // string - A user-assigned ID for the order (like a purchase-order number assigned by a company).
                // This ID is useful for recognizing future states related to this order. ClientOrderId defaults to ''.
                if (this.bodyParams.ClientOrderId) {
                    check(this.bodyParams.ClientOrderId, String);
                } else {
                    this.bodyParams.ClientOrderId = '';
                }

                // real - The quantity of the instrument being ordered.
                this.bodyParams.Quantity = parseFloat(this.bodyParams.Quantity);
                check(this.bodyParams.Quantity, Number);

                // real - The price at which to execute the order, if the order is a Limit order.
                this.bodyParams.LimitPrice = parseFloat(this.bodyParams.LimitPrice);
                if (this.bodyParams.LimitPrice) {
                    check(this.bodyParams.LimitPrice, Number);
                } else {
                    this.bodyParams.LimitPrice = Decimal(0);
                }

                // integer - One Cancels the Other — If this order is order A, OrderIdOCO refers
                // to the order ID of an order B (which is not the order being created by this call).
                // If order B executes, then order A created by this call is canceled. You can also
                // set up order B to watch order A in the same way, but that may require an update to
                // order B to make it watch this one, which could have implications for priority in
                // the order book. See CancelReplaceOrder and ModifyOrder.
                this.bodyParams.OrderIdOCO = Number(this.bodyParams.OrderIdOCO).valueOf();
                if (this.bodyParams.OrderIdOCO) {
                    check(this.bodyParams.OrderIdOCO, Number);
                } else {
                    this.bodyParams.OrderIdOCO = 0;
                }

                // string - The type of this order, as expressed in integer format. See Order Types above for an explanation of each type. One of: 1 Market, 2 Limit, 3 StopMarket, 4 StopLimit, 5 TrailingStopMarket, 6 TrailingStopLimit, 7 BlockTrade.
                this.bodyParams.OrderType = String(this.bodyParams.OrderType).valueOf();
                check(this.bodyParams.OrderType, String);

                // integer - When entering a stop/trailing order, set PegPriceType to an integer that
                // corresponds to the type of price that pegs the stop: 1 Last, 2 Bid, 3 Ask, 4 Midpoint
                this.bodyParams.PegPriceType = Number(this.bodyParams.PegPriceType).valueOf();
                if (this.bodyParams.PegPriceType) {
                    check(this.bodyParams.PegPriceType, Number);
                } else {
                    this.bodyParams.PegPriceType = 0;
                }

                // string - The Symbol of the instrument being traded in the order.
                this.bodyParams.InstrumentSymbol = String(this.bodyParams.InstrumentSymbol).valueOf();
                check(this.bodyParams.InstrumentSymbol, String);

                // real - The offset by which to trail the market in one of the trailing order types.
                // Set this to the current price of the market to ensure that the trailing offset is
                // the amount intended in a fast-moving market. See <a href="#Order-Types">Order Types</a> above.
                this.bodyParams.TrailingAmount = parseFloat(this.bodyParams.TrailingAmount);
                if (this.bodyParams.TrailingAmount) {
                    check(this.bodyParams.TrailingAmount, Number);
                } else {
                    this.bodyParams.TrailingAmount = 0;
                }

                // real - The amount by which a trailing limit order is offset from the activation price.
                this.bodyParams.LimitOffset = parseFloat(this.bodyParams.LimitOffset);
                if (this.bodyParams.LimitOffset) {
                    check(this.bodyParams.LimitOffset, Number);
                } else {
                    this.bodyParams.LimitOffset = 0;
                }

                // integer - The side of the trade represented by this order. One of: `Buy`, `Sell`
                this.bodyParams.Side = String(this.bodyParams.Side).valueOf();
                check(this.bodyParams.Side, String);

                // real - The price at which to execute the order, if the order is a Stop order (either buy or sell).
                this.bodyParams.StopPrice = parseFloat(this.bodyParams.StopPrice);
                if (this.bodyParams.StopPrice) {
                    check(this.bodyParams.StopPrice, Number);
                } else {
                    this.bodyParams.StopPrice = 0;
                }

                // string - The period during which the order is executable.
                // `GTC good ’til canceled`, `IOC immediate or cancelled`,
                // `FOK fill or kill — fill the order immediately, or cancel it immediately`.
                if (this.bodyParams.TimeInForce) {
                    check(this.bodyParams.TimeInForce, String);
                } else {
                    this.bodyParams.TimeInForce = 'GTC';
                }

                const obj = {
                    UserId: this.user._id,
                    Quantity: Decimal(this.bodyParams.Quantity),
                    OrderType: this.bodyParams.OrderType,
                    InstrumentSymbol: this.bodyParams.InstrumentSymbol,
                    Side: this.bodyParams.Side,
                    OrderState: 'Working',
                };
                
                const { bodyParams } = this;
                _.map(['ClientOrderId', 'OrderIdOCO', 'PegPriceType', 'TimeInForce'], function(name) {
                    if (bodyParams[name]) {
                        obj[name] = bodyParams[name];
                    }
                });
                
                _.map(['LimitPrice', 'TrailingAmount', 'LimitOffset', 'StopPrice'], function(name) {
                    if (bodyParams[name]) {
                        obj[name] = Decimal(bodyParams[name]);
                    }
                });
                
                const OrderId = order.insert(obj);

                return {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: {
                        OrderId,
                    },
                };
            },
        },
    });

/**
 * Modify order
 */
Api.addRoute('modifyorder',
    {
        authRequired: true,
        enableCors: true,
    },
    {
        post: {
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
                
                if (checkSigned(this.bodyParams)) {
                    return {
                        statusCode: 9001,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'Old request. Method requires be SIGNED in the time frame.',
                        },
                    };
                }

                if (checkProtected(this.bodyParams, this.user._id)) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'The body signature is invalid. ',
                        },
                    };
                }
                
                // string - The ID of the Order Management System where the original order was placed.
                check(this.bodyParams.OrderId, String);

                // string - The ID of the instrument traded in the order
                this.bodyParams.InstrumentSymbol = Number(this.bodyParams.InstrumentSymbol).valueOf();
                check(this.bodyParams.InstrumentSymbol, Number);

                // integer - The order revision number at the time you make the modification order. This ensures that you have the latest order state at the time you make the request.
                this.bodyParams.PreviousOrderRevision = Number(this.bodyParams.PreviousOrderRevision).valueOf();
                check(this.bodyParams.PreviousOrderRevision, Number);

                // real - The new quantity of the order. This value can only be reduced from a previous quantity.
                this.bodyParams.Quantity = parseFloat(this.bodyParams.Quantity);
                check(this.bodyParams.Quantity, Number);

                const currentOrder = order.findOne({
                    _id: this.bodyParams.OrderId,
                    UserId: this.user._id,
                    InstrumentSymbol: this.bodyParams.InstrumentSymbol,
                    PreviousOrderRevision: this.bodyParams.PreviousOrderRevision,
                });
                if (currentOrder) {
                    if (currentOrder.Quantity.lte(this.bodyParams.Quantity)) {
                        return {
                            statusCode: 9002,
                            body: {
                                status: 'error',
                                timestamp: new Date().getTime(),
                                message: 'An order’s quantity can only be reduced',
                            },
                        };
                    }
                    if (order.update({
                        _id: this.bodyParams.OrderId,
                        UserId: this.user._id,
                        InstrumentSymbol: this.bodyParams.InstrumentSymbol,
                        PreviousOrderRevision: this.bodyParams.PreviousOrderRevision,
                    },
                    {
                        $set:
                               {
                                   PreviousOrderRevision: { $inc: 1 },
                                   Quantity: Decimal(this.bodyParams.Quantity),
                               },
                    })
                    ) {
                        return {
                            status: 'success',
                            timestamp: new Date().getTime(),
                            data: {
                            },
                        };
                    }
                }

                return {
                    statusCode: 9002,
                    body: {
                        status: 'error',
                        timestamp: new Date().getTime(),
                        message: 'Wrong parameters',
                    },
                };
            },
        },
    });

/**
 * Cancel order
 */
Api.addRoute('cancelorder',
    {
        authRequired: true,
        enableCors: true,
    },
    {
        post: {
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
                
                if (checkSigned(this.bodyParams)) {
                    return {
                        statusCode: 9001,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'Old request. Method requires be SIGNED in the time frame.',
                        },
                    };
                }

                if (checkProtected(this.bodyParams, this.user._id)) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'The body signature is invalid. ',
                        },
                    };
                }
                
                // string, conditionally optional - A user-assigned ID for the order (like a purchase-order number assigned by a company).
                // ClientOrderId defaults to ''.
                if (this.bodyParams.ClientOrderId) {
                    check(this.bodyParams.ClientOrderId, String);
                } else {
                    this.bodyParams.ClientOrderId = '';
                }

                // string, conditionally optional - The order to be cancelled.
                if (this.bodyParams.OrderId) {
                    check(this.bodyParams.OrderId, String);
                } else {
                    this.bodyParams.OrderId = '';
                }

                if ((this.bodyParams.OrderId != 0 || this.bodyParams.ClientOrderId != 0)
                    && order.findOne({
                        $or: [{ _id: this.bodyParams.OrderId }, { ClientOrderId: this.bodyParams.ClientOrderId }],
                        UserId: this.user._id,
                    })
                ) {
                    if (order.update({
                        $or: [{ _id: this.bodyParams.OrderId }, { ClientOrderId: this.bodyParams.ClientOrderId }],
                        UserId: this.user._id,
                    },
                    { $set: { OrderState: 'Canceled' } })
                    ) {
                        return {
                            status: 'success',
                            timestamp: new Date().getTime(),
                            data: {
                            },
                        };
                    }
                }

                return {
                    statusCode: 9002,
                    body: {
                        status: 'error',
                        timestamp: new Date().getTime(),
                        message: 'Wrong parameters',
                    },
                };
            },
        },
    });

/**
 * Cancel and replace order
 * `CancelReplaceOrder` - is single API call that both cancels an existing order and replaces it with a new order.
 * Canceling one order and replacing it with another also cancels the order’s priority in the order book.
 * You can use `ModifyOrder` to preserve priority in the book; but `ModifyOrder` only allows a reduction in order quantity.
 * Notice: `CancelReplaceOrder` sacrifices the order’s priority in the order book
 */
Api.addRoute('cancelreplaceorder',
    {
        authRequired: true,
        enableCors: true,
    },
    {
        post: {
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

                if (checkSigned(this.bodyParams)) {
                    return {
                        statusCode: 9001,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'Old request. Method requires be SIGNED in the time frame.',
                        },
                    };
                }

                if (checkProtected(this.bodyParams, this.user._id)) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'The body signature is invalid. ',
                        },
                    };
                }
                
                // string - The ID of the order to replace with this order.
                check(this.bodyParams.OrderIdToReplace, String);

                // string, defaults 0 - A user-assigned ID for the new, replacement order (like a purchase-order number assigned by a company). This ID is useful for recognizing future states related to this order.
                if (this.bodyParams.ClientOrderId) {
                    check(this.bodyParams.ClientOrderId, String);
                } else {
                    this.bodyParams.ClientOrderId = 0;
                }

                // string - The type of the replacement order: 1 Market, 2 Limit, 3 StopMarket, 4 StopLimit, 5 TrailingStopMarket, 6 TrailingStopLimit, 7 BlockTrade
                check(this.bodyParams.OrderType, String);

                // string - The side of the replacement order: 0 Buy, 1 Sell
                check(this.bodyParams.Side, String);

                // string - The Symbol of the instrument being traded.
                check(this.bodyParams.InstrumentSymbol, String);

                // real - The offset by which to trail the market in one of the trailing order types.
                // Set this to the current price of the market to ensure that the trailing offset is
                // the amount intended in a fast-moving market.
                this.bodyParams.TrailingAmount = parseFloat(this.bodyParams.TrailingAmount);
                if (this.bodyParams.TrailingAmount) {
                    check(this.bodyParams.TrailingAmount, Number);
                } else {
                    this.bodyParams.TrailingAmount = 0;
                }

                // real - The price at which to execute the new order, if the order is a Limit order.
                this.bodyParams.LimitPrice = parseFloat(this.bodyParams.LimitPrice);
                if (this.bodyParams.LimitPrice) {
                    check(this.bodyParams.LimitPrice, Number);
                } else {
                    this.bodyParams.LimitPrice = 0;
                }

                // real - The price at which to execute the new order, if the order is a Stop order (either buy or sell).
                this.bodyParams.StopPrice = parseFloat(this.bodyParams.StopPrice);
                if (this.bodyParams.StopPrice) {
                    check(this.bodyParams.StopPrice, Number);
                } else {
                    this.bodyParams.StopPrice = 0;
                }

                // string - When entering a stop/trailing order, set PegPriceType to the type of price that pegs the stop.
                // 1 Last, 2 Bid, 3 Ask, 4 Midpoint
                this.bodyParams.PegPriceType = String(this.bodyParams.PegPriceType).valueOf();
                if (this.bodyParams.PegPriceType) {
                    check(this.bodyParams.PegPriceType, String);
                } else {
                    this.bodyParams.PegPriceType = 0;
                }

                // string - The period during which the new order is executable.
                // 1 GTC good ’til canceled, 3 IOC immediate or canceled,
                // 4 FOK fill or kill — fill the order immediately, or cancel it immediately.
                // There may be other settings for TimeInForce depending on the trading venue.
                this.bodyParams.TimeInForce = String(this.bodyParams.TimeInForce).valueOf();
                if (this.bodyParams.TimeInForce) {
                    check(this.bodyParams.TimeInForce, String);
                } else {
                    this.bodyParams.TimeInForce = 1;
                }

                // string - One Cancels the Other — If the order being canceled in this call is order A,
                // and the order replacing order A in this call is order B, then OrderIdOCO refers to
                // an order C that is currently open. If order C executes, then order B is canceled.
                // You can also set up order C to watch order B in this way, but that will require an update to order C.
                this.bodyParams.OrderIdOCO = String(this.bodyParams.OrderIdOCO).valueOf();
                if (this.bodyParams.OrderIdOCO) {
                    check(this.bodyParams.OrderIdOCO, String);
                } else {
                    this.bodyParams.OrderIdOCO = 0;
                }

                // real - The amount of the order (buy or sell).
                this.bodyParams.Quantity = parseFloat(this.bodyParams.Quantity);
                if (this.bodyParams.Quantity) {
                    check(this.bodyParams.Quantity, Number);
                } else {
                    this.bodyParams.Quantity = 0;
                }

                const currentOrder = order.findOne({ _id: this.bodyParams.OrderIdToReplace, UserId: this.user._id });
                if (currentOrder) {
                    if (order.update({ _id: this.bodyParams.OrderIdToReplace, UserId: this.user._id },
                        { $set: { OrderState: 'Rejected' } })
                    ) {
                        const obj = {
                            UserId: this.user._id,
                            Quantity: Decimal(this.bodyParams.Quantity),
                            OrderType: this.bodyParams.OrderType,
                            InstrumentSymbol: this.bodyParams.InstrumentSymbol,
                            Side: this.bodyParams.Side,
                            OrderState: 'Working',
                            OrigOrderId: currentOrder.OrderId,
                            OrigClOrdId: currentOrder.ClientOrderId,
                        };
                        
                        const { bodyParams } = this;
                        _.map(['ClientOrderId', 'OrderIdOCO', 'PegPriceType', 'TimeInForce'], function(name) {
                            if (bodyParams[name]) {
                                obj[name] = bodyParams[name];
                            }
                        });
                        
                        _.map(['LimitPrice', 'TrailingAmount', 'LimitOffset', 'StopPrice'], function(name) {
                            if (bodyParams[name]) {
                                obj[name] = Decimal(bodyParams[name]);
                            }
                        });
                        
                        const OrderId = order.insert(obj);
                        
                        return {
                            status: 'success',
                            timestamp: new Date().getTime(),
                            data: {
                                ReplacementOrderId: OrderId,
                                ReplacementClOrdId: this.bodyParams.ClientOrderId,
                                OrigOrderId: currentOrder.OrderId,
                                OrigClOrdId: currentOrder.ClientOrderId,
                            },
                        };
                    }
                }

                return {
                    statusCode: 9002,
                    body: {
                        status: 'error',
                        timestamp: new Date().getTime(),
                        message: 'Wrong parameters',
                    },
                };
            },
        },
    });

/**
 * Cancel all orders
 */
Api.addRoute('cancelallorders',
    {
        authRequired: true,
        enableCors: true,
    },
    {
        post: {
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
                
                if (checkSigned(this.bodyParams)) {
                    return {
                        statusCode: 9001,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'Old request. Method requires be SIGNED in the time frame.',
                        },
                    };
                }

                if (checkProtected(this.bodyParams, this.user._id)) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'The body signature is invalid. ',
                        },
                    };
                }
                
                // integer, conditionally optional - The Symbol of the instrument for which all orders are being cancelled.
                if (!_.isUndefined(this.bodyParams.InstrumentSymbol)) {
                    this.bodyParams.InstrumentSymbol = String(this.bodyParams.InstrumentSymbol).valueOf();
                    check(this.bodyParams.InstrumentSymbol, String);
                    order.update({ InstrumentSymbol: this.bodyParams.InstrumentSymbol, UserId: this.user._id },
                        { $set: { OrderState: 'Canceled' } },
                        { multi: true });
                    return {
                        status: 'success',
                        timestamp: new Date().getTime(),
                        data: {
                        },
                    };
                }
                
                order.update({ UserId: this.user._id },
                    { $set: { OrderState: 'Canceled' } },
                    { multi: true });
                return {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: {
                    },
                };
            },
        },
    });

/**
 * Get open orders for current logged in user
 */
Api.addRoute('getopenorders',
    {
        authRequired: true,
        enableCors: true,
    },
    {
        get: {
            /*
            * @params StartIndex - integer
            *     The starting index into the history of open orders, from 0 (the most recent opened orders).
            * @params Counts - integer
            *     The number of orders to return. The system can return up to 200 orders.
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

                if (checkSigned(this.bodyParams)) {
                    return {
                        statusCode: 9001,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'Old request. Method requires be SIGNED in the time frame.',
                        },
                    };
                }

                if (checkProtected(this.bodyParams, this.user._id)) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'The body signature is invalid. ',
                        },
                    };
                }
                
                this.bodyParams.StartIndex = Number(this.bodyParams.StartIndex).valueOf();
                check(this.bodyParams.StartIndex, Number);
                this.bodyParams.Counts = Number(this.bodyParams.Counts).valueOf();
                check(this.bodyParams.Counts, Number);

                if (this.bodyParams.Counts > 200) {
                    this.bodyParams.Counts = 200;
                }

                if (order.findOne({ UserId: this.user._id })) {
                    return {
                        status: 'success',
                        timestamp: new Date().getTime(),
                        data: order.find({ UserId: this.user._id, OrderState: 'Working' },
                            {
                                limit: this.bodyParams.Counts,
                                skip: this.bodyParams.StartIndex,
                                fields: {
                                    Side: 1,
                                    OrderId: 1,
                                    Price: 1,
                                    Quantity: 1,
                                    InstrumentSymbol: 1,
                                    OrderType: 1,
                                    ClientOrderId: 1,
                                    OrderState: 1,
                                    ReceiveTime: 1,
                                    OrigQuantity: 1,
                                    QuantityExecuted: 1,
                                    ChangeReason: 1,
                                    OrigOrderId: 1,
                                    OrigClOrdId: 1,
                                    InsideAsk: 1,
                                    InsideAskSize: 1,
                                    InsideBid: 1,
                                    InsideBidSize: 1,
                                    LastTradePrice: 1,
                                    RejectReason: 1,
                                    IsLockedIn: 1,
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
 * Get order fee
 */
Api.addRoute('getorderfee',
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

                // string - The proposed instrument against which a trading fee would be charged.
                this.bodyParams.InstrumentSymbol = String(this.bodyParams.InstrumentSymbol).valueOf();
                check(this.bodyParams.InstrumentSymbol, String);

                // string - The ID of the product (currency) in which the fee will be denominated.
                this.bodyParams.ProductSymbol = String(this.bodyParams.ProductSymbol).valueOf();
                check(this.bodyParams.ProductSymbol, String);

                // real - The quantity of the proposed trade for which the Order Management System would charge a fee.
                this.bodyParams.Amount = parseFloat(this.bodyParams.Amount);
                if (this.bodyParams.Amount) {
                    check(this.bodyParams.Amount, Number);
                } else {
                    this.bodyParams.Amount = 0;
                }

                // real - The price at which the proposed trade would take place. Supply your price for a limit order;
                // the exact price is difficult to know before execution.
                this.bodyParams.Price = parseFloat(this.bodyParams.Price);
                if (this.bodyParams.Price) {
                    check(this.bodyParams.Price, Number);
                } else {
                    this.bodyParams.Price = 0;
                }

                // string - The type of the proposed order. One of: 1 Market, 2 Limit, 3 StopMarket, 4 StopLimit,
                // 5 TrailingStopMarket, 6 TrailingStopLimit, 7 BlockTrade.
                this.bodyParams.OrderType = String(this.bodyParams.OrderType).valueOf();
                check(this.bodyParams.OrderType, String);

                // string - Depending on the venue, there may be different fees for a maker (the order remains on the books for
                // a period) or taker (the order executes directly). If the user places a large order that is only partially
                // filled, he is a partial maker. 1 Maker, 2 Taker
                this.bodyParams.MakerTaker = String(this.bodyParams.MakerTaker).valueOf();
                check(this.bodyParams.MakerTaker, String);

                // @TODO add logic or fee definition
                return {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: {
                        OrderFee: 0,
                        ProductSymbol: 'X',
                    },
                };
            },
        },
    });

/**
 * Get order status by Order Id for current logged in user
 */
Api.addRoute('getorderstatus',
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

                if (checkSigned(this.bodyParams)) {
                    return {
                        statusCode: 9001,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'Old request. Method requires be SIGNED in the time frame.',
                        },
                    };
                }

                if (checkProtected(this.bodyParams, this.user._id)) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'The body signature is invalid. ',
                        },
                    };
                }
                
                this.bodyParams.OrderId = String(this.bodyParams.OrderId).valueOf();
                check(this.bodyParams.OrderId, String);

                if (order.findOne({ _id: this.bodyParams.OrderId, UserId: this.user._id })) {
                    return {
                        status: 'success',
                        timestamp: new Date().getTime(),
                        data: order.find({ _id: this.bodyParams.OrderId, UserId: this.user._id },
                            {
                                fields: {
                                    Side: 1,
                                    OrderId: 1,
                                    Price: 1,
                                    Quantity: 1,
                                    InstrumentSymbol: 1,
                                    OrderType: 1,
                                    ClientOrderId: 1,
                                    OrderState: 1,
                                    ReceiveTime: 1,
                                    OrigQuantity: 1,
                                    QuantityExecuted: 1,
                                    ChangeReason: 1,
                                    OrigOrderId: 1,
                                    OrigClOrdId: 1,
                                    InsideAsk: 1,
                                    InsideAskSize: 1,
                                    InsideBid: 1,
                                    InsideBidSize: 1,
                                    LastTradePrice: 1,
                                    RejectReason: 1,
                                    IsLockedIn: 1,
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
 * Get order history for current logged in user
 */
Api.addRoute('getorderhistory',
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

                if (checkSigned(this.bodyParams)) {
                    return {
                        statusCode: 9001,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'Old request. Method requires be SIGNED in the time frame.',
                        },
                    };
                }

                if (checkProtected(this.bodyParams, this.user._id)) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'The body signature is invalid. ',
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

                if (order.findOne({ UserId: this.user._id })) {
                    return {
                        status: 'success',
                        timestamp: new Date().getTime(),
                        data: order.find({ UserId: this.user._id },
                            {
                                limit: this.bodyParams.Counts,
                                skip: this.bodyParams.StartIndex,
                                fields: {
                                    Side: 1,
                                    OrderId: 1,
                                    Price: 1,
                                    Quantity: 1,
                                    InstrumentSymbol: 1,
                                    OrderType: 1,
                                    ClientOrderId: 1,
                                    OrderState: 1,
                                    ReceiveTime: 1,
                                    OrigQuantity: 1,
                                    QuantityExecuted: 1,
                                    ChangeReason: 1,
                                    OrigOrderId: 1,
                                    OrigClOrdId: 1,
                                    InsideAsk: 1,
                                    InsideAskSize: 1,
                                    InsideBid: 1,
                                    InsideBidSize: 1,
                                    LastTradePrice: 1,
                                    RejectReason: 1,
                                    IsLockedIn: 1,
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
 * Get order history by Order Id for current logged in user
 */
Api.addRoute('getorderhistorybyorderid',
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

                if (checkSigned(this.bodyParams)) {
                    return {
                        statusCode: 9001,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'Old request. Method requires be SIGNED in the time frame.',
                        },
                    };
                }

                if (checkProtected(this.bodyParams, this.user._id)) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'The body signature is invalid. ',
                        },
                    };
                }
                
                this.bodyParams.OrderId = String(this.bodyParams.OrderId).valueOf();
                check(this.bodyParams.OrderId, String);

                if (order.findOne({ _id: this.bodyParams.OrderId, UserId: this.user._id })) {
                    return {
                        status: 'success',
                        timestamp: new Date().getTime(),
                        data: order.find({ UserId: this.user._id },
                            {
                                fields: {
                                    Side: 1,
                                    OrderId: 1,
                                    Price: 1,
                                    Quantity: 1,
                                    InstrumentSymbol: 1,
                                    OrderType: 1,
                                    ClientOrderId: 1,
                                    OrderState: 1,
                                    ReceiveTime: 1,
                                    OrigQuantity: 1,
                                    QuantityExecuted: 1,
                                    ChangeReason: 1,
                                    OrigOrderId: 1,
                                    OrigClOrdId: 1,
                                    InsideAsk: 1,
                                    InsideAskSize: 1,
                                    InsideBid: 1,
                                    InsideBidSize: 1,
                                    LastTradePrice: 1,
                                    RejectReason: 1,
                                    IsLockedIn: 1,
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
 * Get orders history for current logged in user
 */
Api.addRoute('getordershistory',
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

                if (checkSigned(this.bodyParams)) {
                    return {
                        statusCode: 9001,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'Old request. Method requires be SIGNED in the time frame.',
                        },
                    };
                }

                if (checkProtected(this.bodyParams, this.user._id)) {
                    return {
                        statusCode: 403,
                        body: {
                            status: 'error',
                            timestamp: new Date().getTime(),
                            message: 'The body signature is invalid. ',
                        },
                    };
                }
                
                const params = { UserId: this.user._id };

                // string - A user-assigned ID for the order (like a purchase-order number assigned by a company).
                // ClientOrderId defaults to 0.
                if (this.bodyParams.ClientOrderId) {
                    this.bodyParams.ClientOrderId = String(this.bodyParams.ClientOrderId).valueOf();
                    check(this.bodyParams.ClientOrderId, String);
                    params.ClientOrderId = this.bodyParams.ClientOrderId;
                }

                // string - The original ID of the order.
                // If specified, the call returns changed orders associated with this order ID.
                if (this.bodyParams.OriginalOrderId) {
                    this.bodyParams.OriginalOrderId = String(this.bodyParams.OriginalOrderId).valueOf();
                    check(this.bodyParams.OriginalOrderId, String);
                    params.OriginalOrderId = this.bodyParams.OriginalOrderId;
                }

                // string - The Symbol of the instrument named in the order.
                // If not specified, the call returns orders for all instruments for this account.
                if (this.bodyParams.InstrumentSymbol) {
                    this.bodyParams.InstrumentSymbol = String(this.bodyParams.InstrumentSymbol).valueOf();
                    check(this.bodyParams.InstrumentSymbol, String);
                    params.InstrumentSymbol = this.bodyParams.InstrumentSymbol;
                }

                // integer - Date and time at which to begin the orders history, in milliseconds.
                if (this.bodyParams.StartTimeStamp) {
                    this.bodyParams.StartTimeStamp = Number(this.bodyParams.StartTimeStamp).valueOf();
                    check(this.bodyParams.StartTimeStamp, Number);
                    params.ReceiveTime = { $gte: this.bodyParams.StartTimeStamp };
                }

                // integer - Date and time at which to end the orders history, in milliseconds.
                if (this.bodyParams.EndTimestamp) {
                    this.bodyParams.EndTimestamp = Number(this.bodyParams.EndTimestamp).valueOf();
                    check(this.bodyParams.EndTimestamp, Number);
                    params.ReceiveTime = { $lte: this.bodyParams.EndTimestamp };
                }

                // integer - In this case, the count of orders to return, counting from the StartIndex.
                // If not specified, returns all orders between BeginTimeStamp and EndTimeStamp,
                // beginning at StartIndex and working backwards.
                if (this.bodyParams.Depth) {
                    this.bodyParams.Depth = Number(this.bodyParams.Depth).valueOf();
                    check(this.bodyParams.Depth, Number);
                } else {
                    this.bodyParams.Depth = 100;
                }

                if (this.bodyParams.Depth > 200) {
                    this.bodyParams.Depth = 200;
                }

                // integer - The starting index into the order history, from 0 (the most recent trade) and
                // moving backwards in time.
                // If not specified, defaults to 0.
                if (this.bodyParams.StartIndex) {
                    this.bodyParams.StartIndex = Number(this.bodyParams.StartIndex).valueOf();
                    check(this.bodyParams.StartIndex, Number);
                    params.Index = { $gte: this.bodyParams.StartIndex };
                }

                // @TODO this logic !!!
                return {
                    status: 'success',
                    timestamp: new Date().getTime(),
                    data: order.find(params,
                        {
                            limit: this.bodyParams.Depth,
                            fields: {
                                Side: 1,
                                OrderId: 1,
                                Price: 1,
                                Quantity: 1,
                                InstrumentSymbol: 1,
                                OrderType: 1,
                                ClientOrderId: 1,
                                OrderState: 1,
                                ReceiveTime: 1,
                                OrigQuantity: 1,
                                QuantityExecuted: 1,
                                ChangeReason: 1,
                                OrigOrderId: 1,
                                OrigClOrdId: 1,
                                InsideAsk: 1,
                                InsideAskSize: 1,
                                InsideBid: 1,
                                InsideBidSize: 1,
                                LastTradePrice: 1,
                                RejectReason: 1,
                                IsLockedIn: 1,
                            },
                            sort: -1,
                        }).fetch(),
                };
            },
        },
    });

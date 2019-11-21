import { JobCollection } from 'meteor/vsivsi:job-collection';
import { FilesCollection } from 'meteor/ostrio:files';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import fs from 'fs';
import pako from 'pako';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Decimal } from 'meteor/mongo-decimal';

const schemas = {};

const AdminCollectionsCount = new Mongo.Collection('adminCollectionsCount');

const profile = new Mongo.Collection('profile');

schemas.profile = new SimpleSchema({
    UserId: {
        type: String,
        label: 'User ID',
    },
    UserName: {
        type: String,
        label: 'User Name',
        optional: true,
    },
    Email: {
        type: String,
        label: 'Email',
        regEx: SimpleSchema.RegEx.Email,
        optional: true,
    },
    AffiliateId: {
        type: String,
        label: 'Affiliate ID',
        optional: true,
    },
    ReferrerId: {
        type: String,
        label: 'Referrer ID',
        optional: true,
    },
    CreatedAt: {
        type: Number,
        label: 'Created at',
        optional: true,
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
    UseOTP: {
        type: Boolean,
        label: 'Use OTP',
        optional: true,
    },
    UseWhiteListIP: {
        type: Boolean,
        label: 'Use white list IP',
        optional: true,
    },
    Telegram: {
        type: String,
        label: 'Telegram',
        optional: true,
    },
    TelegramChatId: {
        type: String,
        label: 'Telegram chat id',
        optional: true,
    },
    VerificationLevel: {
        type: Number,
        label: 'Verification level',
        optional: true,
        defaultValue: 1,
    },
    InitialMessage: {
        type: String,
        label: 'Initial message for Talk',
        optional: true,
        autoform: {
            afFieldInput: {
                type: 'textarea',
                rows: 3,
            },
        },
    },
    Favorite: {
        type: Array,
        label: 'Favorite',
        optional: true,
    },
    'Favorite.$': {
        type: String,
    },
});

profile.attachSchema(schemas.profile);

if (Meteor.isServer) {
    try {
        profile.rawCollection().ensureIndex({ UserId: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const referral_program = new Mongo.Collection('referral_program');

schemas.referral_program = new SimpleSchema({
    UserId: {
        type: String,
        label: 'User ID',
    },
    ReferrerId: {
        type: String,
        label: 'Referrer Id',
    },
    TimeStamp: {
        type: Number,
        label: 'Timestamp',
        optional: true,
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
});

referral_program.attachSchema(schemas.referral_program);

if (Meteor.isServer) {
    try {
        referral_program.rawCollection().ensureIndex({ UserId: 1 });
        referral_program.rawCollection().ensureIndex({ ReferrerId: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const referral_program_agg = new Mongo.Collection('referral_program_agg');

schemas.referral_program_agg = new SimpleSchema({
    UserId: {
        type: String,
        label: 'User ID',
    },
    Total: {
        type: String,
        label: 'Total',
    },
    TimeStamp: {
        type: Number,
        label: 'Timestamp',
        optional: true,
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
});

referral_program_agg.attachSchema(schemas.referral_program_agg);

if (Meteor.isServer) {
    try {
        referral_program_agg.rawCollection().ensureIndex({ UserId: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const api_key = new Mongo.Collection('api_key');

schemas.api_key = new SimpleSchema({
    UserId: {
        type: String,
        label: 'User ID',
    },
    Key: {
        type: String,
        label: 'Key',
    },
    Secret: {
        type: String,
        label: 'Secret',
    },
    TimeStamp: {
        type: Number,
        label: 'Timestamp',
        optional: true,
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
});

api_key.attachSchema(schemas.api_key);

if (Meteor.isServer) {
    try {
        api_key.rawCollection().ensureIndex({ UserId: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const trade = new Mongo.Collection('trade');

schemas.trade = new SimpleSchema({
    UserId: {
        type: String,
        label: 'User ID',
    },
    InstrumentSymbol: {
        type: String,
        label: 'Instrument symbol',
    },
    Side: {
        type: String,
        label: 'Side',
    },
    Quantity: {
        type: Decimal,
        label: 'Quantity',
    },
    RemainingQuantity: {
        type: Decimal,
        label: 'Remaining quantity',
    },
    Price: {
        type: Decimal,
        label: 'Price',
    },
    Value: {
        type: Decimal,
        label: 'Value',
    },
    TradeBid: {
        type: Decimal,
        label: 'Trade bid',
        optional: true,
    },
    TradeAsk: {
        type: Decimal,
        label: 'Trade ask',
        optional: true,
    },
    TradeMidpoint: {
        type: Decimal,
        label: 'Trade midpoint',
        optional: true,
    },
    Fee: {
        type: Decimal,
        label: 'Fee',
    },
    FeeProductSymbol: {
        type: String,
        label: 'Fee product symbol',
    },
    OrderId: {
        type: String,
        label: 'Order Id',
    },
    ClientOrderId: {
        type: String,
        label: 'Client order Id',
        optional: true,
    },
    OrderTradeRevision: {
        type: Number,
        label: 'Order trade revision',
        optional: true,
    },
    ExecutionId: {
        type: String,
        label: 'Execution Id',
    },
    Direction: {
        type: String,
        label: 'Direction',
        allowedValues: ['NoChange', 'UpTick', 'DownTick'],
        autoform: {
            options () {
                return [{ label: 'No Change', value: 'NoChange' },
                    { label: 'Up Tick', value: 'UpTick' },
                    { label: 'Down Tick', value: 'DownTick' },
                ];
            },
        },
    },
    TradeState: {
        type: String,
        label: 'Trade state',
        allowedValues: ['Closed', 'Deferred', 'Refused'],
        autoform: {
            options: [
                { label: 'Closed', value: 'Closed' },
                { label: 'Deferred', value: 'Deferred' },
                { label: 'Refused', value: 'Refused' },
            ],
        },
        defaultValue: 'Closed',
    },
    ExecutionTime: {
        type: Number,
        label: 'Execution time',
        optional: true,
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
    TradeTime: {
        type: Number,
        label: 'Trade time',
        optional: true,
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
    Initial: {
        type: Boolean,
        label: 'Initial deal',
        optional: true,
        defaultValue: false,
    },
    IsBlockTrade: {
        type: Boolean,
        label: 'Is block trade',
        optional: true,
        defaultValue: false,
    },
});

trade.attachSchema(schemas.trade);

if (Meteor.isServer) {
    try {
        trade.rawCollection().ensureIndex({ UserId: 1 });
        trade.rawCollection().ensureIndex({ InstrumentSymbol: 1 });
        trade.rawCollection().ensureIndex({ TradeTime: 1 });
        trade.rawCollection().ensureIndex({ ExecutionTime: 1 });
        trade.rawCollection().ensureIndex({ TradeState: 1 });
        trade.rawCollection().ensureIndex({ FeeProductSymbol: 1 });
        trade.rawCollection().ensureIndex({ OrderId: 1 });
        trade.rawCollection().ensureIndex({ ClientOrderId: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const balance = new Mongo.Collection('balance');

schemas.balance = new SimpleSchema({
    UserId: {
        type: String,
        label: 'User Id',
    },
    ProductSymbol: {
        type: String,
        label: 'Product Symbol',
    },
    Balance: {
        type: Decimal,
        label: 'Balance',
    },
    InTrade: {
        type: Decimal,
        label: 'In trade',
        optional: true,
    },
    DepositAddress: {
        type: String,
        label: 'Deposit address',
        optional: true,
    },
    TrustedAddress: {
        type: String,
        label: 'Trusted address',
        optional: true,
    },
    TimeStamp: {
        type: Number,
        label: 'TimeStamp',
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
});

balance.attachSchema(schemas.balance);

if (Meteor.isServer) {
    try {
        balance.rawCollection().ensureIndex({ UserId: 1 });
        balance.rawCollection().ensureIndex({ ProductSymbol: 1 });
        balance.rawCollection().ensureIndex({ TimeStamp: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const transaction = new Mongo.Collection('transaction');

schemas.transaction = new SimpleSchema({
    UserId: {
        type: String,
        label: 'User Id',
    },
    Credit: {
        type: Decimal,
        label: 'Credit',
        optional: true,
    },
    Debit: {
        type: Decimal,
        label: 'Debit',
    },
    TransactionType: {
        type: String,
        label: 'Transaction type',
        allowedValues: ['Fee', 'Trade', 'Deposit', 'Withdrawal', 'Other', 'Reverse', 'Hold'],
        autoform: {
            options () {
                return [{ label: 'Fee', value: 'Fee' },
                    { label: 'Trade', value: 'Trade' },
                    { label: 'Deposit', value: 'Deposit' },
                    { label: 'Withdrawal', value: 'Withdrawal' },
                    { label: 'Other', value: 'Other' },
                    { label: 'Reverse', value: 'Reverse' },
                    { label: 'Hold', value: 'Hold' },
                ];
            },
        },
    },
    ReferenceId: {
        type: String,
        label: 'Reference Id',
    },
    ReferenceType: {
        type: String,
        label: 'Reference type',
    },
    ProductSymbol: {
        type: String,
        label: 'Product Symbol',
    },
    Balance: {
        type: Decimal,
        label: 'Balance',
    },
    TimeStamp: {
        type: Number,
        label: 'TimeStamp',
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
});

transaction.attachSchema(schemas.transaction);

if (Meteor.isServer) {
    try {
        transaction.rawCollection().ensureIndex({ UserId: 1 });
        transaction.rawCollection().ensureIndex({ CounterpartyId: 1 });
        transaction.rawCollection().ensureIndex({ TransactionType: 1 });
        transaction.rawCollection().ensureIndex({ TimeStamp: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const ticker = new Mongo.Collection('ticker');

schemas.ticker = new SimpleSchema({
    InstrumentSymbol: {
        type: String,
        label: 'Instrument symbol',
    },
    Date: {
        type: Number,
        label: 'Date',
        optional: true,
    },
    High: {
        type: Decimal,
        label: 'High',
    },
    Low: {
        type: Decimal,
        label: 'Low',
    },
    Open: {
        type: Decimal,
        label: 'Open',
    },
    Close: {
        type: Decimal,
        label: 'Close',
    },
    Volume: {
        type: Decimal,
        label: 'Volume',
    },
    InsideBidPrice: {
        type: Decimal,
        label: 'Inside bid price',
    },
    InsideAskPrice: {
        type: Decimal,
        label: 'Inside ask price',
    },
    Interval: {
        type: String,
        label: 'Interval',
        // m -> minutes; h -> hours; d -> days; w -> weeks; M -> months
        allowedValues: ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'],
        autoform: {
            options: _.map(
                ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'],
                function(value) {
                    return { label: value, value };
                },
            ),
        },
    },
});

ticker.attachSchema(schemas.ticker);

if (Meteor.isServer) {
    try {
        ticker.rawCollection().ensureIndex({ InstrumentSymbol: 1 });
        ticker.rawCollection().ensureIndex({ Date: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const price_average = new Mongo.Collection('price_average');

schemas.price_average = new SimpleSchema({
    InstrumentSymbol: {
        type: String,
        label: 'Instrument symbol',
    },
    UpdatedTime: {
        type: Number,
        label: 'Updated time',
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
    Price: {
        type: Decimal,
        label: 'Price',
    },
});

price_average.attachSchema(schemas.price_average);

if (Meteor.isServer) {
    try {
        price_average.rawCollection().ensureIndex({ InstrumentSymbol: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const price_24hr = new Mongo.Collection('price_24hr');

schemas.price_24hr = new SimpleSchema({
    InstrumentSymbol: {
        type: String,
        label: 'Instrument symbol',
    },
    PriceChange: {
        type: Decimal,
        label: 'Price change',
    },
    PriceChangePercent: {
        type: Decimal,
        label: 'Price change percent',
    },
    AveragePrice: {
        type: Decimal,
        label: 'Average price',
    },
    PrevClosePrice: {
        type: Decimal,
        label: 'Prev close price',
    },
    LastPrice: {
        type: Decimal,
        label: 'Last price',
    },
    LastQty: {
        type: Decimal,
        label: 'Last quantity',
    },
    BidPrice: {
        type: Decimal,
        label: 'Bid Price',
    },
    AskPrice: {
        type: Decimal,
        label: 'Ask price',
    },
    OpenPrice: {
        type: Decimal,
        label: 'Open Price',
    },
    HighPrice: {
        type: Decimal,
        label: 'High price',
    },
    LowPrice: {
        type: Decimal,
        label: 'Low price',
    },
    Volume: {
        type: Decimal,
        label: 'Volume',
    },
    QuoteVolume: {
        type: Decimal,
        label: 'Quote volume',
    },
    OpenTime: {
        type: Number,
        label: 'Open time',
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
    CloseTime: {
        type: Number,
        label: 'Close time',
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
    TradeCount: {
        type: Number,
        label: 'Trade count',
    },
});

price_24hr.attachSchema(schemas.price_24hr);

if (Meteor.isServer) {
    try {
        price_24hr.rawCollection().ensureIndex({ InstrumentSymbol: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const price_latest = new Mongo.Collection('price_latest');

schemas.price_latest = new SimpleSchema({
    InstrumentSymbol: {
        type: String,
        label: 'Instrument symbol',
    },
    UpdatedTime: {
        type: Number,
        label: 'Updated time',
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
    Price: {
        type: Decimal,
        label: 'Price change',
    },
});

price_latest.attachSchema(schemas.price_latest);

if (Meteor.isServer) {
    try {
        price_latest.rawCollection().ensureIndex({ InstrumentSymbol: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const product = new Mongo.Collection('product');

schemas.product = new SimpleSchema({
    ProductSymbol: {
        type: String,
        label: 'Product symbol',
    },
    ProductFullName: {
        type: String,
        label: 'Product full name',
    },
    ProductType: {
        type: String,
        label: 'Product type',
        allowedValues: ['NationalCurrency', 'CryptoCurrency', 'Contract'],
        autoform: {
            options: [
                { label: 'National currency', value: 'NationalCurrency' },
                { label: 'Crypto currency', value: 'CryptoCurrency' },
                { label: 'Contract', value: 'Contract' },
            ],
        },
    },
    DecimalPlaces: {
        type: Number,
        label: 'Decimal places',
        defaultValue: 18,
    },
    NoFees: {
        type: Boolean,
        label: 'No fees',
        defaultValue: false,
    },
    Deferred: {
        type: Boolean,
        label: 'Deferred',
        defaultValue: false,
    },
    DepositStatus: {
        type: String,
        label: 'Deposit status',
        allowedValues: ['Running', 'Paused'],
        autoform: {
            options: [
                { label: 'Running', value: 'Running' },
                { label: 'Paused', value: 'Paused' },
            ],
        },
    },
    WithdrawStatus: {
        type: String,
        label: 'Withdraw status',
        allowedValues: ['Running', 'Paused'],
        autoform: {
            options: [
                { label: 'Running', value: 'Running' },
                { label: 'Paused', value: 'Paused' },
            ],
        },
    },
    StatusDescription: {
        type: String,
        label: 'Status description',
        optional: true,
    },
});

product.attachSchema(schemas.product);

if (Meteor.isServer) {
    try {
        product.rawCollection().ensureIndex({ ProductSymbol: 1 });
        product.rawCollection().ensureIndex({ ProductType: 1 });
    } catch (e) {
        // console.log(e);
    }
}

schemas.instrument = new SimpleSchema({
    InstrumentSymbol: {
        type: String,
        label: 'Instrument symbol',
    },
    Product1Symbol: {
        type: String,
        label: 'Product1 symbol',
    },
    Product2Symbol: {
        type: String,
        label: 'Product2 symbol',
    },
    SessionStatus: {
        type: String,
        label: 'Session status',
        allowedValues: ['Running', 'Paused', 'Stopped', 'Starting'],
        autoform: {
            options: [
                { label: 'Running', value: 'Running' },
                { label: 'Paused', value: 'Paused' },
                { label: 'Stopped', value: 'Stopped' },
                { label: 'Starting', value: 'Starting' },
            ],
        },
    },
    PreviousSessionStatus: {
        type: String,
        label: 'Previous session status',
        allowedValues: ['Running', 'Paused', 'Stopped', 'Starting'],
        autoform: {
            options: [
                { label: 'Running', value: 'Running' },
                { label: 'Paused', value: 'Paused' },
                { label: 'Stopped', value: 'Stopped' },
                { label: 'Starting', value: 'Starting' },
            ],
        },
    },
    QuantityIncrement: {
        type: Decimal,
        label: 'Quantity increment',
    },
    MaxQuantity: {
        type: Decimal,
        label: 'Max quantity',
    },
    MinQuantity: {
        type: Decimal,
        label: 'Min quantity',
    },
});

const instrument = new Mongo.Collection('instrument');

instrument.attachSchema(schemas.instrument);

if (Meteor.isServer) {
    try {
        instrument.rawCollection().ensureIndex({ InstrumentSymbol: 1 });
        instrument.rawCollection().ensureIndex({ SessionStatus: 1 });
    } catch (e) {
        // console.log(e);
    }
}

schemas.order = new SimpleSchema({
    UserId: {
        type: String,
        label: 'User Id',
    },
    ClientOrderId: {
        type: String,
        label: 'Client order Id',
        optional: true,
    },
    OrderIdOCO: {
        type: String,
        label: 'Order Id OCO',
        optional: true,
    },
    OrigOrderId: {
        type: String,
        label: 'Original order Id',
        optional: true,
    },
    OrigClOrdId: {
        type: String,
        label: 'Original client order Id',
        optional: true,
    },
    ReceiveTime: {
        type: Number,
        label: 'Receive time',
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
        optional: true,
    },
    InstrumentSymbol: {
        type: String,
        label: 'Instrument symbol',
    },
    Quantity: {
        type: Decimal,
        label: 'Quantity',
    },
    OrderType: {
        type: String,
        label: 'Order type',
        allowedValues: ['Market', 'Limit', 'StopMarket', 'StopLimit', 'TrailingStopMarket', 'TrailingStopLimit', 'BlockTrade'],
        autoform: {
            options: [
                { label: 'Market', value: 'Market' },
                { label: 'Limit', value: 'Limit' },
                { label: 'Stop market', value: 'StopMarket' },
                { label: 'Stop limit', value: 'StopLimit' },
                { label: 'Trailing stop market', value: 'TrailingStopMarket' },
                { label: 'Trailing stop limit', value: 'TrailingStopLimit' },
                { label: 'Block trade', value: 'BlockTrade' },
            ],
        },
    },
    Side: {
        type: String,
        label: 'Side',
        allowedValues: ['Buy', 'Sell'],
        autoform: {
            options: [
                { label: 'Buy', value: 'Buy' },
                { label: 'Sell', value: 'Sell' },
            ],
        },
    },
    OrderState: {
        type: String,
        label: 'Order state',
        allowedValues: ['Working', 'InProcess', 'Rejected', 'Canceled', 'Expired', 'FullyExecuted'],
        autoform: {
            options: [
                { label: 'Working', value: 'Working' },
                { label: 'In Process', value: 'InProcess' },
                { label: 'Rejected', value: 'Rejected' },
                { label: 'Canceled', value: 'Canceled' },
                { label: 'Expired', value: 'Expired' },
                { label: 'Fully executed', value: 'FullyExecuted' },
            ],
        },
        defaultValue: 'Working',
    },
    PegPriceType: {
        type: String,
        label: 'Stop/trailing order price type',
        allowedValues: ['Last', 'Bid', 'Ask', 'Midpoint'],
        autoform: {
            options: [
                { label: 'Last', value: 'Last' },
                { label: 'Bid', value: 'Bid' },
                { label: 'Ask', value: 'Ask' },
                { label: 'Midpoint', value: 'Midpoint' },
            ],
        },
        optional: true,
    },
    LimitPrice: {
        type: Decimal,
        label: 'Limit price',
        optional: true,
    },
    StopPrice: {
        type: Decimal,
        label: 'Stop price',
        optional: true,
    },
    TrailingAmount: {
        type: Decimal,
        label: 'Trailing amount',
        optional: true,
    },
    Price: {
        type: Decimal,
        label: 'Price',
        optional: true,
    },
    LimitOffset: {
        type: Decimal,
        label: 'Limit offset',
        optional: true,
    },
    TimeInForce: {
        type: String,
        label: 'Time in force',
        allowedValues: ['GTC', 'IOC', 'FOK'],
        autoform: {
            options: [
                { label: 'Good until canceled', value: 'GTC' },
                { label: 'Immediate or cancelled', value: 'IOC' }, // can be filled partially
                { label: 'Fill or kill — fill the order immediately, or cancel it immediately', value: 'FOK' }, // must be filled fully
            ],
        },
        defaultValue: 'GTC',
        optional: true,
    },
    OrigQuantity: {
        type: Decimal,
        label: 'Orig quantity',
        optional: true,
    },
    QuantityExecuted: {
        type: Decimal,
        label: 'Quantity executed',
        optional: true,
    },
    ChangeReason: {
        type: String,
        label: 'Change reason',
        allowedValues: ['NewInputAccepted', 'NewInputRejected', 'OtherRejected', 'Expired', 'Trade',
            'SystemCanceled_NoMoreMarket', 'SystemCanceled_BelowMinimum', 'NoChange', 'UserModified'],
        autoform: {
            options: [
                { label: 'New input accepted', value: 'NewInputAccepted' },
                { label: 'New input rejected', value: 'NewInputRejected' },
                { label: 'Other rejected', value: 'OtherRejected' },
                { label: 'Expired', value: 'Expired' },
                { label: 'Trade', value: 'Trade' },
                { label: 'System canceled - No more market', value: 'SystemCanceled_NoMoreMarket' },
                { label: 'System canceled - Below minimum', value: 'SystemCanceled_BelowMinimum' },
                { label: 'No change', value: 'NoChange' },
                { label: 'User modified', value: 'UserModified' },
            ],
        },
        defaultValue: 'NoChange',
        optional: true,
    },
    PreviousOrderRevision: {
        type: String,
        label: 'Previous order revision',
        optional: true,
    },
    RejectReason: {
        type: String,
        label: 'Reject reason',
        optional: true,
    },
    InsideAsk: {
        type: Decimal,
        label: 'Inside ask',
        defaultValue: Decimal('0'),
        optional: true,
    },
    InsideAskSize: {
        type: Decimal,
        label: 'Inside ask size',
        defaultValue: Decimal('0'),
        optional: true,
    },
    InsideBid: {
        type: Decimal,
        label: 'Inside bid',
        defaultValue: Decimal('0'),
        optional: true,
    },
    InsideBidSize: {
        type: Decimal,
        label: 'Inside bid size',
        defaultValue: Decimal('0'),
        optional: true,
    },
    LastTradePrice: {
        type: Decimal,
        label: 'Last trade price',
        defaultValue: Decimal('0'),
        optional: true,
    },
    IsLockedIn: {
        type: Boolean,
        label: 'Is locked in',
        defaultValue: false,
        optional: true,
    },
});

const order = new Mongo.Collection('order');

order.attachSchema(schemas.order);

const fee = new Mongo.Collection('fee');

schemas.fee = new SimpleSchema({
    UserId: {
        type: String,
        label: 'User ID',
    },
    FeeTaker: {
        type: Decimal,
        label: 'Fee Taker',
    },
    FeeMaker: {
        type: Decimal,
        label: 'Fee Maker',
    },
    Volume: {
        type: Decimal,
        label: 'Trade volume for 30 days',
        optional: true,
    },
    UpdatedTime: {
        type: Number,
        label: 'Updated time',
        optional: true,
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
});

fee.attachSchema(schemas.fee);

if (Meteor.isServer) {
    try {
        order.rawCollection().ensureIndex({ UserId: 1 });
        order.rawCollection().ensureIndex({ InstrumentSymbol: 1 });
        order.rawCollection().ensureIndex({ StopPrice: 1 });
        order.rawCollection().ensureIndex({ LimitPrice: 1 });
        order.rawCollection().ensureIndex({ OrderState: 1 });
        order.rawCollection().ensureIndex({ Side: 1 });
        order.rawCollection().ensureIndex({ OrderType: 1 });
        order.rawCollection().ensureIndex({ ClientOrderId: 1 });
        order.rawCollection().ensureIndex({ PreviousOrderRevision: 1 });
        order.rawCollection().ensureIndex({ ReceiveTime: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const notification_history = new Mongo.Collection('notification_history');

schemas.notification_history = new SimpleSchema({
    UserId: {
        type: String,
        label: 'User Id',
    },
    From: {
        type: String,
        label: 'Name of sender',
    },
    Path: {
        type: String,
        label: 'Path',
        optional: true,
        max: 200,
    },
    Message: {
        type: String,
        label: 'Message',
        max: 1000,
    },
    CreatedAt: {
        type: Number,
        label: 'Created at',
        optional: true,
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
    MarkedAsRead: {
        type: Boolean,
        label: 'Mark notification as read',
        defaultValue: false,
    },
});

notification_history.attachSchema(schemas.notification_history);

if (Meteor.isServer) {
    try {
        notification_history.rawCollection().ensureIndex({ UserId: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const notification_payload = new Mongo.Collection('notification_payload');

schemas.notification_payload = new SimpleSchema({
    SubscriptionId: {
        type: String,
        label: 'Subscription Id',
    },
    Data: {
        type: String,
        label: 'Json for payload',
        max: 2024,
    },
    CreatedAt: {
        type: Number,
        label: 'Created at',
        optional: true,
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
});

notification_payload.attachSchema(schemas.notification_payload);

schemas.node = new SimpleSchema({
    Title: {
        type: String,
        label: 'Title',
        max: 200,
    },
    Type: {
        type: String,
        label: 'Type',
    },
    Body: {
        type: String,
        label: 'Body',
    },
    Language: {
        type: String,
        label: 'Language',
        optional: true,
        allowedValues: ['en', 'es', 'de', 'ru', 'fr', 'jp', 'zh', 'kr'],
        autoform: {
            options: [
                { label: 'English', value: 'en' },
                { label: 'Spanish', value: 'es' },
                { label: 'German', value: 'de' },
                { label: 'Russian', value: 'ru' },
                { label: 'French', value: 'fr' },
                { label: 'Japanese', value: 'jp' },
                { label: 'Chinese', value: 'zh' },
                { label: 'Korean', value: 'kr' },
            ],
        },
    },
    CreatedAt: {
        type: Number,
        label: 'Created at',
        optional: true,
        autoValue() { if (!this.isSet && !this.isUpdate) { return new Date().getTime(); } return undefined; },
    },
});

const node = new Mongo.Collection('node');

node.attachSchema(schemas.node);

if (Meteor.isServer) {
    try {
        node.rawCollection().ensureIndex({ Type: 1 });
        node.rawCollection().ensureIndex({ Language: 1 });
    } catch (e) {
        // console.log(e);
    }
}

schemas.variable = new SimpleSchema({
    Name: {
        type: String,
        label: 'Name',
        max: 200,
    },
    Value: {
        type: String,
        label: 'Value',
    },
    Security: {
        type: Boolean,
        label: 'Private (access on server only)',
        defaultValue: true,
    },
    Language: {
        type: String,
        label: 'Language',
        optional: true,
        allowedValues: ['en', 'es', 'de', 'ru', 'fr', 'jp', 'zh', 'kr'],
        autoform: {
            options: [
                { label: 'English', value: 'en' },
                { label: 'Spanish', value: 'es' },
                { label: 'German', value: 'de' },
                { label: 'Russian', value: 'ru' },
                { label: 'French', value: 'fr' },
                { label: 'Japanese', value: 'jp' },
                { label: 'Chinese', value: 'zh' },
                { label: 'Korean', value: 'kr' },
            ],
        },
    },
});

const variable = new Mongo.Collection('variable');

variable.attachSchema(schemas.variable);

if (Meteor.isServer) {
    try {
        variable.rawCollection().ensureIndex({ Name: 1 });
        variable.rawCollection().ensureIndex({ Language: 1 });
    } catch (e) {
        // console.log(e);
    }
}

schemas.sendNotificationSchema = new SimpleSchema({
    UserId: {
        type: String,
        label: 'To',
    },
    Title: {
        type: String,
        label: 'Title',
    },
    Message: {
        type: String,
        label: 'Message',
    },
    Path: {
        type: String,
        label: 'Path',
    },
});

schemas.cronHistory = new SimpleSchema({
    intendedAt: {
        type: Date,
        label: 'Date intended at',
        optional: true,
        autoValue() {
            return new Date();
        },
    },
    name: {
        type: String,
        label: 'Name',
        max: 2024,
        optional: true,
    },
    startedAt: {
        type: Date,
        label: 'Date started at',
        optional: true,
        autoValue() {
            return new Date();
        },
    },
    finishedAt: {
        type: Date,
        label: 'Date finished at',
        optional: true,
        autoValue() {
            return new Date();
        },
    },
    error: {
        type: String,
        label: 'Error',
        max: 4048,
        optional: true,
    },
    result: {
        type: String,
        label: 'Result',
        max: 4048,
        optional: true,
    },
});

if (Meteor.isClient) {
    window.SyncedCron = { _collection: new Mongo.Collection('cronHistory') };
    window.SyncedCron._collection.attachSchema(schemas.cronHistory);
}
    
schemas.support = new SimpleSchema({
    Name: {
        type: String,
        label: 'Your name',
        max: 50,
        defaultValue() {
            if (Meteor.user()) {
                const _profile = profile.findOne({ UserId: Meteor.userId() });
                return (!_.isUndefined(_profile) && !_.isUndefined(_profile.UserName)) ? _profile.UserName : '';
            }
            return '';
        },
    },
    Category: {
        type: String,
        label: 'Category',
        allowedValues: ['Trade', 'Account', 'Feedback', 'ReferralProgram'],
        autoform: {
            options: [
                { label: 'Trade', value: 'Trade' },
                { label: 'Account', value: 'Account' },
                { label: 'Feedback', value: 'Feedback' },
                { label: 'Referral program', value: 'ReferralProgram' },
            ],
        },
        defaultValue: 'Feedback',
    },
    Email: {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        label: 'E-mail',
    },
    Message: {
        type: String,
        label: 'Message',
        max: 1000,
        autoform: {
            afFieldInput: {
                type: 'textarea',
                rows: 3,
            },
        },
    },
});

schemas.talk = new SimpleSchema({
    UserId: {
        type: String,
        label: 'User Id',
    },
    CounterpartyId: {
        type: String,
        label: 'Counterparty Id',
    },
    ArbitrationId: {
        type: String,
        label: 'Arbitration Id',
        optional: true,
    },
    CountMessages: {
        type: Number,
        label: 'Count messages',
        defaultValue: 0,
        optional: true,
    },
    DateLastMessage: {
        type: Number,
        label: 'Date of last message',
        defaultValue: 0,
        optional: true,
    },
    TalkState: {
        type: String,
        label: 'Talk state',
        allowedValues: ['Closed', 'Opened', 'Disputed'],
        autoform: {
            options: [
                { label: 'Closed', value: 'Closed' },
                { label: 'Opened', value: 'Opened' },
                { label: 'Disputed', value: 'Disputed' },
            ],
        },
        defaultValue: 'Closed',
    },
    Identity: {
        type: [Object],
        label: 'Identity for every participators',
        optional: true,
    },
    'Identity.$.UserId': {
        type: String,
    },
    'Identity.$.Body': {
        type: String,
    },
    ReferenceId: {
        type: String,
        label: 'Reference Id',
        optional: true,
    },
    ReferenceType: {
        type: String,
        label: 'Reference type',
        optional: true,
    },
});

const talk = new Mongo.Collection('talk');

talk.attachSchema(schemas.talk);

if (Meteor.isServer) {
    try {
        talk.rawCollection().ensureIndex({ UserId: 1 });
        talk.rawCollection().ensureIndex({ CounterpartyId: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const talk_message = new Mongo.Collection('talk_message');

schemas.talk_message = new SimpleSchema({
    TalkId: {
        type: String,
        label: 'Talk Id',
    },
    Message: {
        type: String,
        label: 'Message',
        max: 40000,
        optional: true,
    },
    From: {
        type: String,
        label: 'Id author',
    },
    To: {
        type: String,
        label: 'Id recipient',
    },
    CreatedAt: {
        type: Number,
        label: 'Created at',
    },
    ReadAt: {
        type: Number,
        label: 'Read at',
        optional: true,
    },
    Status: {
        type: Boolean,
        optional: true,
        label: 'Unread/Read', // Unread === false, Read === true
        defaultValue: false,
    },
    Files: {
        type: Array,
        label: 'Files attached to message',
        optional: true,
    },
    'Files.$': {
        type: Object,
        optional: true,
    },
    'Files.$.Name': {
        type: String,
        optional: true,
    },
    'Files.$.Extension': {
        type: String,
        optional: true,
    },
    'Files.$.Type': {
        type: String,
        optional: true,
    },
    'Files.$._id': {
        type: String,
        optional: true,
    },
    'Files.$.UserId': {
        type: String,
        optional: true,
    },
    'Files.$.Link': {
        type: String,
        optional: true,
    },
});

talk_message.attachSchema(schemas.talk_message);

if (Meteor.isServer) {
    try {
        talk_message.rawCollection().ensureIndex({ TalkId: 1 });
        talk_message.rawCollection().ensureIndex({ From: 1 });
        talk_message.rawCollection().ensureIndex({ To: 1 });
        talk_message.rawCollection().ensureIndex({ CreatedAt: 1 });
    } catch (e) {
        // console.log(e);
    }
}

const user_files = new FilesCollection({
    debug: !_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug,
    collectionName: 'files',
    storagePath: 'private/files',
    allowClientCode: false, // Disallow remove files from Client
    onBeforeUpload(file) {
        // Allow upload files under 20MB, and only in several type of formats
        if (file.size <= 2 * 10485760 && /png|jpg|jpeg|pdf|txt|mp3|mp4/i.test(file.extension)) {
            return true;
        }
        return 'Please upload files in format png, jpg, jpeg, pdf, txt with size equal or less than 20MB';
    },
    onAfterUpload(fileRef) {
        // In the onAfterUpload callback, we will move the file to IPFS
        const self = this;
        _.each(fileRef.versions, async function(vRef, version) {
            // We use random instead of real file's _id
            // to secure files from reverse engineering
            // As after viewing this code it will be easy
            // to get access to unlisted and protected files
            const filePath = `${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}-${version}.${fileRef.extension}`;
      
            const basket = 'escb';

            if (!_.isUndefined(Meteor.settings.public.ipfs) && Meteor.settings.public.ipfs) {
                const data = await global.ipfs.api.add({
                    path: `/${basket}/${filePath}`, // The file path
                    content: fs.readFileSync(fileRef.path),
                });
        
                const upd = {
                    $set: {},
                };
                upd.$set[`versions.${version}.meta.pipeFrom`] = `/${basket}/${filePath}`;
                upd.$set[`versions.${version}.meta.pipePath`] = filePath;
                upd.$set[`versions.${version}.meta.pipeHash`] = data[0].hash;
  
                self.collection.update({
                    _id: fileRef._id,
                }, upd, function (error) {
                    if (error) {
                        console.error(error);
                    } else {
                        // Unlink original files from FS
                        // after successful upload to IPFS
                        self.unlink(self.collection.findOne(fileRef._id), version);
                    }
                });
            }
        });
    },
    interceptDownload(http, fileRef, version) {
        const pipeHash = fileRef.versions != null && fileRef.versions[version] != null && fileRef.versions[version].meta != null ? fileRef.versions[version].meta.pipeHash : null;
        if (pipeHash) {
            if (fileRef.meta.talkId) {
                const _talk = talk.findOne({ _id: fileRef.meta.talkId });
                if (_.isUndefined(_talk)) {
                    http.response.writeHead(400);
                    http.response.end(null);
                    return true;
                }
                
                global.ipfs.api.cat(pipeHash).then((file) => {
                    const data = file.toString();
                    let content_type = fileRef.type;
                    switch (fileRef.type) {
                    case 'text/plain':
                    case 'text/html':
                        content_type = `${content_type}; charset=utf-8`;
                        break;
                    default:
                        break;
                    }
                    http.response.writeHead(200, { 'Content-Type': content_type });
                    if (http.request.method === 'HEAD') {
                        // skip body for HEAD
                        http.response.end();
                        return true;
                    }
                    try {
                        const result = pako.inflate(Buffer.from(data, 'hex'));
                        http.response.end(Buffer.from(result), 'binary');
                    } catch (e) {
                        http.response.end('Internal error', null);
                    }
                    return null;
                });
            } else {
                const stream = global.ipfs.api.catReadableStream(pipeHash);
                stream.on('error', (err) => { throw new Meteor.Error(err); });
                stream.pipe(http.response);
            }
      
            return true;
        }
        // While the file has not been uploaded to IPFS, we will serve it from the filesystem
        return false;
    },
});

if (Meteor.isServer) {
    // Intercept file's collection remove method to remove file from Google Cloud Storage
    const _origuser_filesRemove = user_files.remove;

    user_files.remove = function(search) {
        const cursor = this.collection.find(search);
        cursor.forEach(function(fileRef) {
            _.each(fileRef.versions, function(vRef) {
                if (vRef != null && vRef.meta != null && vRef.meta.pipePath) {
                    global.ipfs.api.files.rm(vRef.meta.pipePath, function(error) {
                        Meteor.bindEnvironment(() => {
                            if (error) {
                                console.error(error);
                            }
                        });
                    });
                }
            });
        });
        // Call the original removal method
        _origuser_filesRemove.call(this, search);
    };
}

/* eslint-disable */ 
let MatchingEngineJobs;
if (Meteor.isServer) {
    MatchingEngineJobs = new JobCollection('MatchingEngine');
    if (Meteor.users.findOne({"emails.0.address": `${Meteor.settings.private.workerLogin}@fake.com`})) {
        const workerId = Meteor.users.findOne({"emails.0.address": `${Meteor.settings.private.workerLogin}@fake.com`})._id;
        MatchingEngineJobs.allow({
          worker: [ workerId ]
        });
    }
    MatchingEngineJobs.startJobServer();
} else {
    MatchingEngineJobs = {};
}
/* eslint-enable */

export {
    profile, trade, ticker, price_average,
    price_24hr, price_latest, product,
    instrument, order, balance, transaction,
    notification_history, notification_payload,
    node, variable, talk, talk_message, user_files,
    referral_program_agg, referral_program, api_key,
    fee, MatchingEngineJobs, AdminCollectionsCount,
    schemas,
};

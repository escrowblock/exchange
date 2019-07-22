import { Factory } from 'meteor/dburles:factory';
import { Decimal } from 'meteor/mongo-decimal';
import { _ } from 'meteor/underscore';
import { faker } from 'meteor/practicalmeteor:faker';
import {
    profile, transaction, trade, ticker, price_average, price_24hr, price_latest, product, instrument, order,
} from '/imports/collections';
import { Accounts } from 'meteor/accounts-base';
import { moment } from 'meteor/momentjs:moment';

// Definition Start
Factory.define('profile', profile, {
    UserId: '',
    UserName: faker.internet.userName(),
    Email: faker.internet.email(),
    AffiliateId: faker.random.number(),
    RefererId: faker.random.number(),
    CreatedAt: faker.date.recent(5).getTime(),
    UseOTP: faker.random.boolean(),
    UseWhiteListIP: faker.random.boolean(),
    Telegram: faker.internet.userName(),
    LoginHistory: {
        Device: faker.random.arrayElement(['android', 'ios', 'desktop']),
        FingerPrint: faker.random.uuid(),
        TimeStamp: faker.date.recent(5).getTime(),
    },
    VerificationLevel: 1,
});

Factory.define('transaction', transaction, {
    UserId: '',
    Credit: () => Decimal(faker.random.boolean() ? +Number(faker.random.number() / 3).toFixed(4) : 0),
    Debit: () => Decimal(faker.random.boolean() ? +Number(faker.random.number() / 3).toFixed(4) : 0),
    TransactionType: faker.random.arrayElement(['Fee', 'Trade', 'Other', 'Reverse', 'Hold']),
    ReferenceId: `0x${faker.random.number()}`,
    ReferenceType: 'Oracle',
    ProductSymbol: 'BTC',
    Balance: () => Decimal(faker.random.number()),
    TimeStamp: faker.date.past().getTime(),
});

Factory.define('trade', trade, {
    UserId: '',
    InstrumentSymbol: 'BTC_USD',
    Side: faker.random.arrayElement(['Buy', 'Sell']),
    Quantity: () => Decimal(faker.random.number()),
    RemainingQuantity: Decimal(faker.random.number()),
    Price: () => Decimal(+Number(faker.random.number({ min: 1000, max: 9999 }) / 3).toFixed(4)),
    Value: () => Decimal(faker.random.number()),
    Fee: () => Decimal(+Number(faker.random.number({ min: 1, max: 100 }) / 3).toFixed(4)),
    FeeProductSymbol: 'BTC',
    OrderId: faker.hacker.noun(),
    ClientOrderId: faker.hacker.noun(),
    OrderTradeRevision: faker.random.number({ min: 0, max: 5 }),
    ExecutionId: faker.random.number(),
    Direction: faker.random.arrayElement(['NoChange', 'UpTick', 'DownTick']),
    TradeState: 'Closed',
    ExecutionTime: faker.date.recent(10).getTime(),
    TradeTime: faker.date.recent(11).getTime(),
    IsBlockTrade: faker.random.boolean(),
});

// for this random number the scaling must be more smootly
Factory.define('ticker', ticker, {
    InstrumentSymbol: 'BTC_USD',
    Date: faker.date.recent(10).getTime(),
    High: () => Decimal(+Number(faker.random.number({ min: 6000, max: 9999 }) / 3).toFixed(4)),
    Low: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
    Open: () => Decimal(+Number(faker.random.number({ min: 1000, max: 9999 }) / 3).toFixed(4)),
    Close: () => Decimal(+Number(faker.random.number({ min: 1000, max: 9999 }) / 3).toFixed(4)),
    Volume: () => Decimal(+Number(faker.random.number({ min: 1000, max: 9999 }) / 3).toFixed(4)),
    InsideBidPrice: () => Decimal(+Number(faker.random.number({ min: 3000, max: 5999 }) / 3).toFixed(4)),
    InsideAskPrice: () => Decimal(+Number(faker.random.number({ min: 4000, max: 4999 }) / 3).toFixed(4)),
    Interval: '1m',
});

Factory.define('price_average', price_average, {
    InstrumentSymbol: 'BTC_USD',
    Seconds: _.random(10, 300),
    Price: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
});

Factory.define('price_24hr', price_24hr, {
    InstrumentSymbol: 'BTC_USD',
    PriceChange: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    PriceChangePercent: () => Decimal(+Number(faker.random.number({ min: 0, max: 99 }) / 3).toFixed(4)),
    AveragePrice: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    PrevClosePrice: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    LastPrice: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    LastQty: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    BidPrice: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    AskPrice: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    OpenPrice: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    HighPrice: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    LowPrice: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    Volume: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    QuoteVolume: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
    OpenTime: faker.date.recent().getTime(),
    CloseTime: faker.date.recent().getTime(),
    TradeCount: faker.random.number({ min: 10, max: 299 }),
});

Factory.define('price_latest', price_latest, {
    InstrumentSymbol: 'BTC_USD',
    Price: () => Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
});

Factory.define('product', product, {
    ProductSymbol: 'BTC',
    ProductFullName: 'Bitcoin',
    ProductType: faker.random.arrayElement(['NationalCurrency', 'CryptoCurrency', 'Contract']),
    DepositStatus: 'Running',
    WithdrawStatus: 'Running',
    DecimalPlaces: () => Decimal(faker.random.number({ min: 1, max: 5 })),
    NoFees: faker.random.boolean(),
});

Factory.define('instrument', instrument, {
    InstrumentSymbol: 'BTC_USD',
    Product1Symbol: 'BTC',
    Product2Symbol: 'USD',
    SessionStatus: faker.random.arrayElement(['Running', 'Paused', 'Stopped', 'Starting']),
    PreviousSessionStatus: faker.random.arrayElement(['Running', 'Paused', 'Stopped', 'Starting']),
    QuantityIncrement: () => Decimal(+Number(faker.random.number({ min: 1, max: 100 }) / 3).toFixed(4)),
    MaxQuantity: () => Decimal(+Number(faker.random.number({ min: 1, max: 100 }) / 3).toFixed(4)),
    MinQuantity: () => Decimal(+Number(faker.random.number({ min: 0.1, max: 1 }) / 3).toFixed(4)),
});

Factory.define('order', order, {
    UserId: '',
    OrderId: faker.random.uuid(),
    ClientOrderId: faker.random.uuid(),
    OrderIdOCO: faker.random.uuid(),
    OrigOrderId: faker.random.uuid(),
    OrigClOrdId: faker.random.uuid(),
    ReceiveTime: faker.date.recent().getTime(),
    InstrumentSymbol: 'BTC_USD',
    Quantity: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
    OrderType: faker.random.arrayElement(['Market', 'Limit', 'StopMarket', 'StopLimit', 'TrailingStopMarket', 'TrailingStopLimit', 'BlockTrade']),
    Side: faker.random.arrayElement(['Buy', 'Sell']),
    OrderState: faker.random.arrayElement(['Working', 'InProcess', 'Rejected', 'Canceled', 'Expired', 'FullyExecuted']),
    PegPriceType: faker.random.arrayElement(['Last', 'Bid', 'Ask', 'Midpoint']),
    LimitPrice: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
    StopPrice: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
    TrailingAmount: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
    Price: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
    LimitOffset: () => Decimal(+Number(faker.random.number({ min: 1, max: 999 }) / 3).toFixed(4)),
    TimeInForce: faker.random.arrayElement(['GTC', 'IOC', 'FOK']),
    OrigQuantity: () => Decimal(+Number(faker.random.number({ min: 1, max: 999 }) / 3).toFixed(4)),
    QuantityExecuted: () => Decimal(+Number(faker.random.number({ min: 1, max: 888 }) / 3).toFixed(4)),
    ChangeReason: faker.random.arrayElement(['NewInputAccepted', 'NewInputRejected', 'OtherRejected', 'Expired', 'Trade',
        'SystemCanceled_NoMoreMarket', 'SystemCanceled_BelowMinimum',
        'NoChange', 'UserModified']),
    PreviousOrderRevision: faker.random.number({ min: 0, max: 5 }),
    RejectReason: faker.hacker.phrase(),
    InsideAsk: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
    InsideAskSize: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
    InsideBid: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
    InsideBidSize: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
    LastTradePrice: () => Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
    IsLockedIn: faker.random.boolean(),
});
// Definition End

const generateFakeDataInstruments = () => {
    Factory.create('product', {
        ProductSymbol: 'BTC',
        ProductFullName: 'Bitcoin',
        ProductType: 'CryptoCurrency',
        DecimalPlaces: faker.random.number({ min: 1, max: 5 }),
        NoFees: faker.random.boolean(),
    });
  
    Factory.create('product', {
        ProductSymbol: 'ETH',
        ProductFullName: 'Ethereum',
        ProductType: 'CryptoCurrency',
        DecimalPlaces: faker.random.number({ min: 1, max: 5 }),
        NoFees: faker.random.boolean(),
    });
  
    Factory.create('product', {
        ProductSymbol: 'USD',
        ProductFullName: 'United States dollar',
        ProductType: 'NationalCurrency',
        DecimalPlaces: faker.random.number({ min: 1, max: 5 }),
        NoFees: faker.random.boolean(),
        Deferred: true,
    });

    Factory.create('product', {
        ProductSymbol: 'ESCB',
        ProductFullName: 'ESCB token',
        ProductType: 'CryptoCurrency',
        DecimalPlaces: faker.random.number({ min: 1, max: 5 }),
        NoFees: faker.random.boolean(),
    });
  
    Factory.create('instrument', {
        InstrumentSymbol: 'BTC_USD', Product1Symbol: 'BTC', Product2Symbol: 'USD', SessionStatus: 'Running',
    });
    Factory.create('instrument', {
        InstrumentSymbol: 'ETH_BTC', Product1Symbol: 'ETH', Product2Symbol: 'BTC', SessionStatus: 'Running',
    });
    Factory.create('instrument', {
        InstrumentSymbol: 'ETH_USD', Product1Symbol: 'ETH', Product2Symbol: 'USD', SessionStatus: 'Running',
    });
    Factory.create('instrument', {
        InstrumentSymbol: 'ESCB_BTC', Product1Symbol: 'ESCB', Product2Symbol: 'BTC', SessionStatus: 'Running',
    });
    Factory.create('instrument', {
        InstrumentSymbol: 'ESCB_ETH', Product1Symbol: 'ESCB', Product2Symbol: 'ETH', SessionStatus: 'Running',
    });
    Factory.create('instrument', {
        InstrumentSymbol: 'ESCB_USD', Product1Symbol: 'ESCB', Product2Symbol: 'USD', SessionStatus: 'Running',
    });
};

const generateFakeData = () => {
    generateFakeDataInstruments();
    _.each(['BTC_USD', 'BTC_ETH', 'ETH_USD', 'USD_BTC', 'ETH_BTC', 'ETH_BTC'], function(symbol) {
        _.each(_.range(100), function(index) {
            _.map([
                { period: 60, name: '1m' }, // 1 minute period
                { period: 3 * 60, name: '3m' }, // 3 minute period
                { period: 5 * 60, name: '5m' }, // 5 minute period
                { period: 15 * 60, name: '15m' }, // 15 minute period
                { period: 30 * 60, name: '30m' }, // 30 minute period
                { period: 60 * 60, name: '1h' }, // 1 hour period
                { period: 2 * 60 * 60, name: '2h' }, // 2 hour period
                { period: 4 * 60 * 60, name: '4h' }, // 4 hour period
                { period: 6 * 60 * 60, name: '6h' }, // 6 hour period
                { period: 8 * 60 * 60, name: '8h' }, // 8 hour period
                { period: 12 * 60 * 60, name: '12h' }, // 12 hour period
                { period: 24 * 60 * 60, name: '1d' }, // 1 day period
                { period: 3 * 24 * 60 * 60, name: '3d' }, // 3 day period
                { period: 7 * 24 * 60 * 60, name: '1w' }, // 1 week period
                { period: 30 * 24 * 60 * 60, name: '1M' }, // 1 month period
            ], (instance) => {
                const High = Decimal(+Number(faker.random.number({ min: 3000, max: 4999 }) / 3).toFixed(4));
                const Low = Decimal(+Number(faker.random.number({ min: 1000, max: High - 100 }) / 3).toFixed(4));
                const Open = Decimal(+Number(faker.random.number({ min: Low, max: High - 100 })).toFixed(4));
                const Close = Decimal(+Number(faker.random.number({ min: Low, max: High - 100 })).toFixed(4));
                Factory.create('ticker', {
                    Date: new Date().getTime() - (instance.period * 1000 * index),
                    InstrumentSymbol: symbol,
                    High,
                    Low,
                    Open,
                    Close,
                    Volume: Decimal(+Number(faker.random.number({ min: 99000, max: 19999 }) / 3).toFixed(4)),
                    InsideBidPrice: Decimal(+Number(faker.random.number({ min: Open, max: Close })).toFixed(4)),
                    InsideAskPrice: Decimal(+Number(faker.random.number({ min: Open, max: Close })).toFixed(4)),
                    Interval: instance.name,
                });
            });
        });
  
        Factory.create('price_average', {
            InstrumentSymbol: symbol,
            Seconds: _.random(10, 300),
            Price: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
        });
      
        Factory.create('price_24hr', {
            InstrumentSymbol: symbol,
            PriceChange: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            PriceChangePercent: Decimal(+Number(faker.random.number({ min: 0, max: 99 }) / 3).toFixed(4)),
            AveragePrice: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            PrevClosePrice: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            LastPrice: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            LastQty: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            BidPrice: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            AskPrice: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            OpenPrice: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            HighPrice: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            LowPrice: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            Volume: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            QuoteVolume: Decimal(+Number(faker.random.number({ min: 100, max: 299 }) / 3).toFixed(4)),
            OpenTime: moment.utc(new Date()).startOf('day').valueOf(),
            CloseTime: moment.utc(new Date()).add(1, 'd').startOf('day').valueOf(),
            TradeCount: faker.random.number({ min: 10, max: 299 }),
        });
  
        Factory.create('price_latest', {
            InstrumentSymbol: symbol,
            Price: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
            UpdatedTime: new Date().getTime(),
        });
    });
  
    // Create 25 users and data for them
    _.each(_.range(25), function() {
        const UserId = Accounts.createUser({
            username: faker.internet.userName(),
            wallet_address: `0x${faker.random.number()}`,
            profile: {
                name: faker.name.findName(),
            },
            email: faker.internet.email(),
            password: 'password',
        });

        Factory.create('profile', {
            UserId,
            UserName: faker.internet.userName(),
            Email: faker.internet.email(),
            AffiliateId: faker.random.number(),
            RefererId: faker.random.number(),
            CreatedAt: faker.date.recent(5).getTime(),
            UseOTP: faker.random.boolean(),
            UseWhiteListIP: faker.random.boolean(),
            Telegram: faker.internet.userName(),
            LoginHistory: {
                Device: faker.random.arrayElement(['android', 'ios', 'desktop']),
                FingerPrint: faker.random.uuid(),
                TimeStamp: faker.date.recent(5).getTime(),
            },
            VerificationLevel: 1,
        });

        _.each(['BTC_USD', 'BTC_ETH', 'ETH_USD', 'USD_BTC', 'ETH_BTC', 'ETH_BTC'], function(symbol) {
            _.each(_.range(faker.random.number({ min: 10, max: 30 })), function() {
                Factory.create('trade', {
                    UserId,
                    InstrumentSymbol: symbol,
                    Side: faker.random.arrayElement(['Buy', 'Sell']),
                    Quantity: Decimal(faker.random.number()),
                    RemainingQuantity: Decimal(faker.random.number()),
                    Price: Decimal(+Number(faker.random.number({ min: 1000, max: 9999 }) / 3).toFixed(4)),
                    Value: Decimal(faker.random.number()),
                    Fee: Decimal(+Number(faker.random.number({ min: 1, max: 100 }) / 3).toFixed(4)),
                    FeeProductSymbol: 'BTC',
                    OrderId: faker.hacker.noun(),
                    ClientOrderId: faker.hacker.noun(),
                    OrderTradeRevision: faker.random.number({ min: 0, max: 5 }),
                    ExecutionId: faker.random.number(),
                    Direction: faker.random.arrayElement(['NoChange', 'UpTick', 'DownTick']),
                    TradeState: 'Closed',
                    ExecutionTime: faker.date.recent(10).getTime(),
                    TradeTime: faker.date.recent(11).getTime(),
                    IsBlockTrade: faker.random.boolean(),
                });
            });
      
            _.each(_.range(faker.random.number({ min: 10, max: 30 })), function() {
                Factory.create('transaction', {
                    UserId,
                    Credit: Decimal(faker.random.boolean() ? +Number(faker.random.number() / 3).toFixed(4) : 0),
                    Debit: Decimal(faker.random.boolean() ? +Number(faker.random.number() / 3).toFixed(4) : 0),
                    TransactionType: faker.random.arrayElement(['Fee', 'Trade', 'Other', 'Reverse', 'Hold']),
                    ReferenceId: `0x${faker.random.number()}`,
                    ReferenceType: 'Oracle',
                    ProductSymbol: 'BTC',
                    Balance: Decimal(faker.random.number()),
                    TimeStamp: faker.date.past().getTime(),
                });
            });
      
            _.each(_.range(faker.random.number({ min: 10, max: 30 })), function() {
                Factory.create('order', {
                    UserId,
                    OrderId: faker.random.uuid(),
                    ClientOrderId: faker.random.uuid(),
                    OrderIdOCO: faker.random.uuid(),
                    OrigOrderId: faker.random.uuid(),
                    OrigClOrdId: faker.random.uuid(),
                    ReceiveTime: faker.date.recent().getTime(),
                    InstrumentSymbol: symbol,
                    Quantity: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
                    OrderType: faker.random.arrayElement(['Market', 'Limit', 'StopMarket', 'StopLimit', 'TrailingStopMarket', 'TrailingStopLimit', 'BlockTrade']),
                    Side: faker.random.arrayElement(['Buy', 'Sell']),
                    OrderState: faker.random.arrayElement(['Working', 'InProcess', 'Rejected', 'Canceled', 'Expired', 'FullyExecuted']),
                    PegPriceType: faker.random.arrayElement(['Last', 'Bid', 'Ask', 'Midpoint']),
                    LimitPrice: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
                    StopPrice: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
                    TrailingAmount: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
                    Price: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
                    LimitOffset: Decimal(+Number(faker.random.number({ min: 1, max: 999 }) / 3).toFixed(4)),
                    TimeInForce: faker.random.arrayElement(['GTC', 'IOC', 'FOK']),
                    OrigQuantity: Decimal(+Number(faker.random.number({ min: 1, max: 999 }) / 3).toFixed(4)),
                    QuantityExecuted: Decimal(+Number(faker.random.number({ min: 1, max: 888 }) / 3).toFixed(4)),
                    ChangeReason: faker.random.arrayElement(['NewInputAccepted', 'NewInputRejected', 'OtherRejected', 'Expired', 'Trade',
                        'SystemCanceled_NoMoreMarket', 'SystemCanceled_BelowMinimum',
                        'NoChange', 'UserModified']),
                    PreviousOrderRevision: faker.random.number({ min: 0, max: 5 }),
                    RejectReason: faker.hacker.phrase(),
                    InsideAsk: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
                    InsideAskSize: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
                    InsideBid: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
                    InsideBidSize: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
                    LastTradePrice: Decimal(+Number(faker.random.number({ min: 1000, max: 5999 }) / 3).toFixed(4)),
                    IsLockedIn: faker.random.boolean(),
                });
            });
        });
    });
};


export { generateFakeData, generateFakeDataInstruments };

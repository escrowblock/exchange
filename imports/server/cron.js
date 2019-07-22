import { Random } from 'meteor/random';
import { Decimal } from 'meteor/mongo-decimal';
import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { EJSON } from 'meteor/ejson';
import { faker } from 'meteor/practicalmeteor:faker';
import { SyncedCron } from 'meteor/percolate:synced-cron';
import {
    instrument, variable, price_average, order, balance, transaction,
} from '/imports/collections.js';
import '/imports/fakeData.js';
import '/imports/tools.js';
import '/imports/server/dbhooks.js';
import asyncX from 'async';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

SyncedCron.config({
    // Log job run details to console
    log: false,

    // Use a custom logger function (defaults to Meteor's logging package)
    logger: null,

    // Name of collection to use for synchronisation and logging
    collectionName: 'cronHistory',

    // Default to using localTime
    utc: true,

    /*
  TTL in seconds for history records in collection to expire
  NOTE: Unset to remove expiry but ensure you remove the index from
  mongo by hand

  ALSO: SyncedCron can't use the `_ensureIndex` command to modify
  the TTL index. The best way to modify the default value of
  `collectionTTL` is to remove the index by hand (in the mongo shell
  run `db.cronHistory.dropIndex({startedAt: 1})`) and re-run your
  project. SyncedCron will recreate the index with the updated TTL.
  */
    collectionTTL: 172800,
});

if (!_.isUndefined(Meteor.settings.public.sandbox) && Meteor.settings.public.sandbox && !Meteor.isTest) {
    SyncedCron.add({
        name: 'Create fake orders',
        schedule(parser) {
            return parser.cron('*/1 * * * *');
        },
        job() {
            const flag = variable.findOne({ Name: 'fakeOrderSanboxStatus' }) ? variable.findOne({ Name: 'fakeOrderSanboxStatus' }).Value : 'free';
            const count = variable.findOne({ Name: 'fakeOrderSanboxCount' }) ? variable.findOne({ Name: 'fakeOrderSanboxCount' }).Value : { count: 50, pause: 1000 };

            const blocked = variable.findOne({ Name: 'fakeOrderSanboxBlocked' }) ? variable.findOne({ Name: 'fakeOrderSanboxBlocked' }).Value : false;
              
            if (flag === 'free' && !blocked) {
                const availableInstruments = instrument.find({ SessionStatus: 'Running' }).map(function(obj) {
                    return obj.InstrumentSymbol;
                });

                // possible case on the start
                if (availableInstruments.length === 0) {
                    return false;
                }
  
                _.each(_.range(count.count), async function() {
                    const InstrumentSymbol = availableInstruments[faker.random.number({ min: 0, max: availableInstruments.length - 1 })];

                    const currentPrice = price_average.findOne({ InstrumentSymbol }) ? price_average.findOne({ InstrumentSymbol }).Price : Decimal('0');

                    try {
                        const directionUp = faker.random.number({ min: 0, max: 100 }) > 50;
                        const fakePrice = directionUp ? currentPrice.add(faker.random.number({ min: 0, max: 19.223 }) / 3) : currentPrice.sub(faker.random.number({ min: 0, max: 19.223 }) / 3);
                        const _OrderType = faker.random.arrayElement(['Market', 'Limit', 'StopMarket', 'StopLimit', 'TrailingStopMarket', 'TrailingStopLimit']);
                        const _quantity = Decimal(+Number(faker.random.number({ min: 0.01, max: 99 }) / 3).toFixed(4));
                        const _side = faker.random.arrayElement(['Buy', 'Sell']);

                        let fakeStopPrice;
                        switch (_side) {
                        case 'Buy':
                            fakeStopPrice = directionUp ? fakePrice.sub(faker.random.number({ min: 0, max: 50 }) / 3) : fakePrice.add(faker.random.number({ min: 0, max: 50 }) / 3);
                            break;
                        case 'Sell':
                            fakeStopPrice = directionUp ? fakePrice.add(faker.random.number({ min: 0, max: 50 }) / 3) : fakePrice.sub(faker.random.number({ min: 0, max: 50 }) / 3);
                            break;
                        default:
                            break;
                        }
  
                        const _order = {
                            UserId: 'CRON',
                            OrderId: faker.random.uuid(),
                            ClientOrderId: faker.random.uuid(),
                            OrderIdOCO: faker.random.uuid(),
                            OrigOrderId: faker.random.uuid(),
                            OrigClOrdId: faker.random.uuid(),
                            InstrumentSymbol,
                            PreviousOrderRevision: 0,
                            RejectReason: '',
                            Quantity: _quantity,
                            ChangeReason: 'NewInputAccepted',
                            QuantityExecuted: Decimal('0'),
                            OrderType: _OrderType,
                            Side: _side,
                            OrderState: 'Working',
                            Price: fakePrice,
                            TimeInForce: faker.random.arrayElement(['GTC', 'IOC', 'FOK']),
                            OrigQuantity: _quantity,
                            InsideAsk: Decimal('0'),
                            InsideAskSize: Decimal('0'),
                            InsideBid: Decimal('0'),
                            InsideBidSize: Decimal('0'),
                            LastTradePrice: Decimal('0'),
                            IsLockedIn: false,
                        };
    
                        switch (_OrderType) {
                        case 'Market':
                            break;
                        case 'Limit':
                            _order.LimitPrice = fakePrice;
                            break;
                        case 'StopMarket':
                            _order.StopPrice = fakeStopPrice;
                            break;
                        case 'StopLimit':
                            _order.StopPrice = fakeStopPrice;
                            _order.LimitPrice = fakePrice;
                            break;
                        case 'TrailingStopMarket':
                            _order.StopPrice = fakeStopPrice;
                            _order.LimitPrice = fakePrice;
                            _order.PegPriceType = faker.random.arrayElement(['Last', 'Bid', 'Ask', 'Midpoint']);
                            _order.TrailingAmount = Decimal(faker.random.number({ min: 2, max: 20 }) / 3);
                            break;
                        case 'TrailingStopLimit':
                            _order.StopPrice = fakeStopPrice;
                            _order.LimitPrice = fakePrice;
                            _order.PegPriceType = faker.random.arrayElement(['Last', 'Bid', 'Ask', 'Midpoint']);
                            _order.TrailingAmount = Decimal(faker.random.number({ min: 2, max: 20 }) / 3);
                            _order.LimitOffset = Decimal(faker.random.number({ min: 1, max: 10 }) / 3);
                            break;
                        default:
                            break;
                        }

                        order.insert(_order);
                    } catch (e) {
                        if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
                            console.log(e);
                        }
                    }
                    await sleep(count.pause);
                });
                variable.upsert({ Name: 'fakeOrderSanboxStatus' }, { $set: { Security: true, Value: 'free' } });
            }
    
            return false;
        },
    });

    global.SyncedCron.add({
        name: 'Check deposits for sandbox',
        schedule(parser) {
            return parser.cron('*/1 * * * *');
        },
        job() {
            const solidBalance = Decimal('10');

            const currentDate = new Date().getTime();

            const flag = variable.findOne({ Name: 'depositSanboxStatus' }) ? variable.findOne({ Name: 'depositSanboxStatus' }).Value : 'free';
           
            const taskRaw = variable.findOne({ Name: 'depositSanboxTask' })
                ? variable.findOne({ Name: 'depositSanboxTask' }).Value
                : EJSON.stringify({ timestamp: currentDate, chunk: 40 });

            const task = JSON.parse(taskRaw);

            const blocked = variable.findOne({ Name: 'depositSanboxBlocked' })
                ? variable.findOne({ Name: 'depositSanboxBlocked' }).Value
                : false;
              
            let depositFetched;
            if (flag === 'free' && !blocked) {
                variable.upsert({ Name: 'depositSanboxStatus' }, { $set: { Security: true, Value: 'busy' } });

                depositFetched = balance.find({ DepositAddress: { $exists: 1 }, Balance: { $lt: solidBalance }, TimeStamp: { $lte: task.timestamp } }, { fields: { UserId: 1, ProductSymbol: 1, Balance: 1 }, limit: task.chunk }).fetch();

                if (_.isEmpty(depositFetched)) {
                    task.timestamp = currentDate - 10 * 60 * 1000;
                    depositFetched = balance.find({ DepositAddress: { $exists: 1 }, Balance: { $lt: solidBalance }, TimeStamp: { $lte: task.timestamp } }, { fields: { UserId: 1, ProductSymbol: 1, Balance: 1 }, limit: task.chunk }).fetch();
                }

                asyncX.mapSeries(depositFetched, function(objDeposit, cbDeposit) {
                    const amount = solidBalance.minus(objDeposit.Balance);
                    if (amount) {
                        transaction.insert({
                            UserId: objDeposit.UserId,
                            Credit: Decimal('0'),
                            Debit: amount,
                            TransactionType: 'Deposit',
                            ReferenceId: Random.id(),
                            ReferenceType: `Blockchain ${objDeposit.ProductSymbol}`,
                            ProductSymbol: objDeposit.ProductSymbol,
                            Balance: solidBalance,
                            TimeStamp: currentDate,
                        }, function (e) {
                            if (!e) {
                                balance.update({ UserId: objDeposit.UserId, ProductSymbol: objDeposit.ProductSymbol },
                                    { $set: { Balance: solidBalance, TimeStamp: currentDate } }, function () {
                                        cbDeposit(null, '');
                                    });
                            } else {
                                cbDeposit(e, '');
                            }
                        });
                    }
                },
                // finish for all deposits
                function() { // err, results
                    task.timestamp = currentDate - 10 * 60 * 1000;
                    variable.upsert({ Name: 'depositSanboxTask' }, { $set: { Security: true, Value: EJSON.stringify(task) } });
                    variable.upsert({ Name: 'depositSanboxStatus' }, { $set: { Security: true, Value: 'free' } });
                    depositFetched = null;
                });

                return '';
            }
            return '';
        },
    });
}

global.SyncedCron.start();

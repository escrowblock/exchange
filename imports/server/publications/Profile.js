import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import {
    profile, transaction, api_key, product, balance,
} from '/imports/collections';

Meteor.publish('Profile', function () {
    if (this.userId) {
        const self = this;
        const handle = profile
            .find({ UserId: this.userId })
            .observe({
                added(docArg) {
                    const doc = docArg;
                    doc.ethaddress = Meteor.users.findOne({ _id: doc.UserId }, { fields: { 'services.ethereum.id': 1 } }).services.ethereum.id;
                    self.added('profile', doc._id, doc);
                },
                changed(docArg) {
                    const doc = docArg;
                    doc.ethaddress = Meteor.users.findOne({ _id: doc.UserId }, { fields: { 'services.ethereum.id': 1 } }).services.ethereum.id;
                    self.changed('profile', doc._id, doc);
                },
                removed(doc) {
                    self.removed('profile', doc._id);
                },
            });

        self.ready();
        self.onStop(function () {
            handle.stop();
        });
    } else {
        this.ready();
    }
});

Meteor.publish('UserBalance', function() {
    return balance.find({ UserId: this.userId });
});

Meteor.publish('AvailableProduct', function() {
    return product.find({ ProductType: { $in: ['CryptoCurrency', 'Contract'] } },
        {
            sort: { ProductSymbol: -1 },
            fields: {
                ProductSymbol: 1,
                ProductFullName: 1,
                ProductType: 1,
                DepositStatus: 1,
                WithdrawStatus: 1,
                StatusDescription: 1,
            },
        });
});

Meteor.publish('ApiKey', function() {
    return api_key.find({ UserId: this.userId });
});

Meteor.publish('UserTransactions', function(page) {
    check(page, Number);
    const limitTransactions = 10;
    const UserId = this.userId;
    return transaction.find({ UserId }, { sort: { TimeStamp: -1 }, limit: limitTransactions, skip: page * limitTransactions });
});

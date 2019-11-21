import sendNotification from '/imports/notifications';
import {
    profile, instrument, api_key, balance, transaction, schemas,
} from '/imports/collections';
import { Random } from 'meteor/random';
import { Decimal } from 'meteor/mongo-decimal';
import qrcode from 'qrcode';
import util from 'ethereumjs-util';
import { _ } from 'meteor/underscore';
import { Push } from 'meteor/raix:push';
import { TAPi18n } from 'meteor/tap:i18n';
import { MeteorOTP } from 'meteor/pascoual:otp';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EJSON } from 'meteor/ejson';

Meteor.methods({
    updateProfile (docArg) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to update profile');
        }
        const doc = docArg;
        // Important server-side check for security and data integrity
        doc.insertDoc.UserId = Meteor.userId();
        doc.updateDoc.$set.UserId = Meteor.userId();

        // @DEBUG
        if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
            console.debug(EJSON.stringify(doc));
        }
        //

        if (doc.updateDoc.$set.Email == '' && doc.updateDoc.$set.UseWhiteListIP) {
            throw new Meteor.Error(403, 'Please set up email address for enabling white list IP feature');
        }
    
        check(doc.insertDoc, schemas.profile);
        const old_profile = profile.findOne({ UserId: Meteor.userId() });
    
        if (old_profile && old_profile.UseOTP == true && doc.updateDoc.$set.UseOTP == false) {
            if (MeteorOTP.checkOTPExpiration(Meteor.user())) {
                throw new Meteor.Error(403, 'For disabling OTP you must enter the current OTP code to confirm your intention');
            }
            Meteor.users.update(Meteor.userId(), { $unset: { onePassCodeTmp: '', onePassCode: '' } });
        }
    
        profile.upsert({ UserId: Meteor.userId() }, doc.updateDoc);
    
        if (old_profile && old_profile.Email != doc.updateDoc.$set.Email) {
            sendNotification(TAPi18n.__('Changed email'), TAPi18n.__('AWARE_CHANGE_EMAIL'), Meteor.userId(), '/profile');
        }
    },
    addToFavorite (InstrumentSymbol) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to add to favorite');
        }
        if (instrument.findOne({ InstrumentSymbol })) {
            profile.update({ UserId: Meteor.userId() }, { $push: { Favorite: InstrumentSymbol } });
        }
    },
    removeFromFavorite (InstrumentSymbol) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to remove from favorite');
        }
        if (instrument.findOne({ InstrumentSymbol })) {
            profile.update({ UserId: Meteor.userId() }, { $pull: { Favorite: InstrumentSymbol } });
        }
    },
    updateLanguage (lang) {
        check(lang, String);
        if (Meteor.userId() != null) {
            Meteor.users.update({ _id: Meteor.userId() }, { $set: { 'profile.language': lang } });
        }
    },
    getPushStatus () {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        return !!Push.appCollection.findOne({ userId: Meteor.userId(), token: { $exists: true } });
    },
    generateNewApiKey () {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        const currentTime = new Date().getTime();
        
        api_key.upsert({ UserId: Meteor.userId() },
            {
                $set: {
                    Key: Random.secret(),
                    Secret: Random.secret(),
                    TimeStamp: currentTime,
                },
            });
    },
    prepareWithdraw (symbol, address, amount, signature) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        check(symbol, String);
        check(address, String);
        check(amount, String);
        check(signature, String);
    
        const decimalAmount = Decimal(amount);
        
        const userBalance = balance.findOne({ UserId: Meteor.userId(), ProductSymbol: symbol, Balance: { $lt: decimalAmount } });
        if (!_.isUndefined(userBalance)) {
            throw new Meteor.Error("You don't have enough balance to withdraw");
        }
    
        if (address != userBalance.TrustedAddress) {
            throw new Meteor.Error('Your trusted address is not the same specified by your earlier. Set up on deposit step.');
        }
    
        const msg = `Withdrawal operation for ${amount} amount on ${userBalance.TrustedAddress} address`;
        const msgBuffer = util.toBuffer(msg);
        const msgHash = util.hashPersonalMessage(msgBuffer);
        const signatureBuffer = util.toBuffer(signature);
        const signatureParams = util.fromRpcSig(signatureBuffer);
        const publickey = util.ecrecover(
            msgHash,
            signatureParams.v,
            signatureParams.r,
            signatureParams.s,
        );
    
        let _DbPublickey = '';
        try {
            _DbPublickey = Meteor.users.findOne({ _id: Meteor.userId() }).services.ethereum.publickey;
        } catch (e) {
            throw new Meteor.Error("The operation can't be confirmed");
        }
    
        if (_DbPublickey != publickey.toString('hex')) {
            throw new Meteor.Error('Your signature is wrong');
        }
    
        const _currentBalance = balance.findOne({ UserId: Meteor.userId(), ProductSymbol: symbol }).Balance;
        const newBalance = _currentBalance.sub(decimalAmount);
    
        transaction.insert({
            UserId: Meteor.userId(),
            Credit: decimalAmount,
            Debit: Decimal('0'),
            TransactionType: 'Withdrawal',
            ReferenceId: signature,
            ReferenceType: `Blockchain ${symbol}`,
            ProductSymbol: symbol,
            Balance: newBalance,
            TimeStamp: new Date().getTime(),
        }, function() {
            balance.update({ UserId: Meteor.userId(), ProductSymbol: symbol },
                { $set: { Balance: newBalance, TimeStamp: new Date().getTime() } });
        });
    
        if (!_.isUndefined(Meteor.settings.public.sandbox) && Meteor.settings.public.sandbox) {
            // nothing to do in this mode
        } else {
            // @TODO create and deploy contract to withdraw via oracle
        }
    },
    setTrustedAddress (symbol, TrustedAddress) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        check(symbol, String);
        check(TrustedAddress, String);
        const _currBalance = balance.findOne({ UserId: Meteor.userId(), ProductSymbol: symbol });
        if (!_.isUndefined(_currBalance)) {
            if (_.isUndefined(_currBalance.TrustedAddress)) {
                balance.update({ UserId: Meteor.userId(), ProductSymbol: symbol }, { $set: { TrustedAddress } });
            }
        } else {
            let _balance = Decimal('0');
            if (!_.isUndefined(Meteor.settings.public.sandbox) && Meteor.settings.public.sandbox) {
                _balance = Decimal('10');
            } else {
                _balance = Decimal('0');
            }
            balance.insert({
                UserId: Meteor.userId(), ProductSymbol: symbol, TrustedAddress, Balance: _balance, InTrade: Decimal('0'),
            });
        }
        return true;
    },
    prepareDeposit (symbol) {
        if (Meteor.userId() == null) {
            throw new Meteor.Error(403, 'Please log in to do this operation');
        }
        check(symbol, String);
    
        let address = false;
        let trustedAddress = '';
        const _currBalance = balance.findOne({ UserId: Meteor.userId(), ProductSymbol: symbol });
        if (!_.isUndefined(_currBalance)) {
            if (!_.isUndefined(_currBalance.DepositAddress)) {
                address = _currBalance.DepositAddress;
            }
            if (!_.isUndefined(_currBalance.TrustedAddress)) {
                trustedAddress = _currBalance.TrustedAddress;
            }
        }
    
        if (!address) {
            if (!_.isUndefined(Meteor.settings.public.sandbox) && Meteor.settings.public.sandbox) {
                address = Random.id();
            } else {
                // @TODO main logic on blockchain -> need to receive from oracle on blockchain
            }
      
            balance.update({ UserId: Meteor.userId(), ProductSymbol: symbol }, { $set: { DepositAddress: address } });
        }
     
        const image = new Promise((resolve) => {
            qrcode.toDataURL(address, function(err, result) {
                if (err) {
                    console.log(err);
                    resolve('');
                }
                resolve(result);
            });
        }).await();

        return { qrcode: image, address, trustedAddress };
    },
});

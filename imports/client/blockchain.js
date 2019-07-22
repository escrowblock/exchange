import { Meteor } from 'meteor/meteor';
import { Buffer } from 'buffer';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';
import ETHWallet from 'ethereumjs-wallet';
import Transaction from 'ethereumjs-tx';
import ethUtil from 'ethereumjs-util';
import ProviderEngine from 'web3-provider-engine';
import RpcSubprovider from 'web3-provider-engine/subproviders/rpc';
import HookedWalletSubprovider from 'web3-provider-engine/subproviders/hooked-wallet';
import { $ } from 'meteor/jquery';
// import TrezorProvider from '@daonomic/trezor-wallet-provider';
// import createLedgerSubprovider from '@ledgerhq/web3-subprovider';
// import TransportU2F from '@ledgerhq/hw-transport-u2f';
                
const concatSig = function(vArg, rArg, sArg) {
    let r = ethUtil.fromSigned(rArg);
    let s = ethUtil.fromSigned(sArg);
    let v = ethUtil.bufferToInt(vArg);
    r = ethUtil.toUnsigned(r).toString('hex');
    s = ethUtil.toUnsigned(s).toString('hex');
    v = ethUtil.stripHexPrefix(ethUtil.intToHex(v));
    return ethUtil.addHexPrefix(r.concat(s, v).toString('hex'));
};

export function generateWeb3WalletEngineProvider(personal_wallet, callback = () => {}) {
    window.web3Engine = new ProviderEngine();
    
    window.web3Engine.addProvider(new HookedWalletSubprovider({
        // approveTransaction: function(cb){ ... },
        signTransaction(txParams, cb) {
            if (txParams.from !== personal_wallet.getAddressString()) {
                return callback('Account not found');
            }
            const tx = new Transaction(txParams);
            tx.sign(personal_wallet.getPrivateKey());
            const rawTx = `0x${tx.serialize().toString('hex')}`;
            cb(null, rawTx);
            return null;
        },
        getAccounts (cb) {
            cb(null, [personal_wallet.getAddressString()]);
            return null;
        },
        getPrivateKey (address, cb) {
            if (address !== personal_wallet.getAddressString()) {
                return cb('Account not found');
            }
            cb(null, personal_wallet.getPrivateKey());
            return null;
        },
        signMessage(msgParams, cb) {
            const dataBuff = ethUtil.toBuffer(msgParams.data);
            const msgHash = ethUtil.hashPersonalMessage(dataBuff);
            const sig = ethUtil.ecsign(msgHash, personal_wallet.getPrivateKey());
            const serialized = ethUtil.bufferToHex(concatSig(sig.v, sig.r, sig.s));
            cb(null, serialized);
            return null;
        },
        signPersonalMessage(msgParams, cb) {
            const dataBuff = ethUtil.toBuffer(msgParams.data);
            const msgHash = ethUtil.hashPersonalMessage(dataBuff);
            const sig = ethUtil.ecsign(msgHash, personal_wallet.getPrivateKey());
            const serialized = ethUtil.bufferToHex(concatSig(sig.v, sig.r, sig.s));
            cb(null, serialized);
            return null;
        },
    }));

    let providerUrl = `https://mainnet.infura.io/v3/${Meteor.settings.public.infura_token}`;
    if (Meteor.settings.public.debug) {
        providerUrl = `https://ropsten.infura.io/v3/${Meteor.settings.public.infura_token}`;
    }

    // data source
    window.web3Engine.addProvider(
        new RpcSubprovider({ rpcUrl: providerUrl }),
    );
    window.web3Engine.start();

    if (window.web3) {
        window.web3_previous = window.web3;
    }
    
    window.web3 = new window.Web3(window.web3Engine);
    window.web3.eth.defaultAccount = personal_wallet.getAddressString();
    callback();
    return null;
}

export const initializeContact = name => new Promise(function(resolve, reject) {
    Meteor.call('loadContract', name, function(error, result) {
        if (error) {
            reject(error);
            return false;
        }
        const { blockchain } = Meteor.settings.public;
        const contract = window.web3.eth.Contract ? new window.web3.eth.Contract(result.abi, blockchain[name]) : window.web3.eth.contract(result.abi).at(blockchain[name]);
      
        if (!_.isUndefined(Meteor.settings.public.debug) && Meteor.settings.public.debug) {
            console.log(name, contract, blockchain[name]);
        }

        // instantiate by address
        Session.set(`${name}ContractInstance`, contract);
        resolve();
        return true;
    });
    return null;
});

export function generateWeb3EngineProvider(cb = () => {}) {
    window.web3Engine = new ProviderEngine();

    let providerUrl = `https://mainnet.infura.io/v3/${Meteor.settings.public.infura_token}`;
    if (Meteor.settings.public.debug) {
        providerUrl = `https://ropsten.infura.io/v3/${Meteor.settings.public.infura_token}`;
    }
    // data source
    window.web3Engine.addProvider(
        new RpcSubprovider({ rpcUrl: providerUrl, timeout: 5000 }),
    );
    window.web3Engine.start();

    if (window.web3) {
        window.web3_previous = window.web3;
    }
    window.web3 = new window.Web3(window.web3Engine);
    cb();
    return null;
}

/*
//https://github.com/daonomic/trezor-wallet-provider
export function generateWeb3EngineTrezorProvider(cb = () => {}) {
    try {
      let providerUrl = `https://mainnet.infura.io/v3/${Meteor.settings.public.infura_token}`;
      if (Meteor.settings.public.debug) {
        providerUrl = `https://ropsten.infura.io/v3/${Meteor.settings.public.infura_token}`;
      }

      window.web3Engine = new ProviderEngine();
      window.web3Engine.addProvider(new TrezorProvider("m/44'/1'/0'/0/0"));

      // data source
      window.web3Engine.addProvider(
        new RpcSubprovider({rpcUrl: providerUrl, timeout: 5000})
      );

      window.web3Engine.start();

      if (window.web3) {
        window.web3_previous = window.web3;
      }
      window.web3 = new Web3(window.web3Engine);

      cb();
    } catch(e) {
      cb("We can't detect unlocked Trezor", null);
    }
    return null;
}
*/

/*
//https://github.com/LedgerHQ/ledgerjs/tree/master/packages/web3-subprovider
export function generateWeb3EngineLedgerProvider(cb = () => {}) {
    try {
        let providerUrl = `https://mainnet.infura.io/v3/${Meteor.settings.public.infura_token}`;
        if (Meteor.settings.public.debug) {
          providerUrl = `https://ropsten.infura.io/v3/${Meteor.settings.public.infura_token}`;
        }
        window.web3Engine = new ProviderEngine();
        window.web3Engine.addProvider(createLedgerSubprovider(TransportU2F.create(), {accountsLength: 5}));

        // data source
        window.web3Engine.addProvider(
          new RpcSubprovider({rpcUrl: providerUrl, timeout: 5000})
        );

        window.web3Engine.start();

        if (window.web3) {
          window.web3_previous = window.web3;
        }
        window.web3 = new window.Web3(web3Engine);
        cb();
    } catch(e) {
        cb("We can't detect unlocked Ledger", null);
    }
}
*/

export const signature = (text, callback) => {
    try {
        const hex = window.web3.toHex ? window.web3.toHex(text) : window.web3.utils.toHex(text);
        const params = [hex, window.web3.eth.defaultAccount];
        const method = 'personal_sign';

        window.web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method,
            params,
            from: window.web3.eth.defaultAccount,
        }, function(error, signature) {
            if (error) {
                callback(new Meteor.Error('User denied message signature.'), null);
                return false;
            }
      
            callback(null, signature.result);
            return null;
        });
    } catch (error) {
        callback(error, null);
    }
    return null;
};

export const signatureAuth = (callback) => {
    import Cookies from 'js-cookie';

    try {
        const hex = window.web3.toHex ? window.web3.toHex('The footprint for authentication') : window.web3.utils.toHex('The footprint for authentication');
        const params = [hex, window.web3.eth.defaultAccount];
        const method = 'personal_sign';

        window.web3.currentProvider.sendAsync({
            jsonrpc: '2.0',
            method,
            params,
            from: window.web3.eth.defaultAccount,
        }, function(error, signatureArg) {
            let signature = signatureArg;
            if (error || signature.error) {
                callback(new Meteor.Error('User denied message signature.'), null);
                return false;
            }
            signature = signature.result;
      
            const AffiliateId = Session.get('AffiliateId') ? Session.get('AffiliateId') : Cookies.get('AffiliateId');
            Session.clearPersistent('AffiliateId', null);
            Cookies.remove('AffiliateId', null);

            Meteor.loginWithEthereum(window.web3.eth.defaultAccount, signature, { profile: { ReferrerId: AffiliateId } }, (error) => {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, true);
                }
            });
            return null;
        });
    } catch (error) {
        callback(error, null);
    }
    return null;
};

export const generateNewWallet = (personal_wallet, v3json) => {
    Session.setAuth('personalWallet', personal_wallet);
    Session.setAuth('v3json', v3json);
    Session.setAuth('personalWalletCreated', true);
    Session.setAuth('walletAddress', personal_wallet.getAddressString());

    setTimeout(function() {
        $('#walletAddress').val(personal_wallet.getAddressString()).attr('readonly', 'readonly');
    }, 1000);
    return null;
};

export const unlockWallet = (personal_wallet, error, cb = () => {}) => {
    import { modalAlert } from '/imports/modal';
    import { TAPi18n } from 'meteor/tap:i18n';
    
    import { Router } from 'meteor/iron:router';

    if (error) {
        modalAlert(TAPi18n.__('Oops, something happened'), TAPi18n.__('Your Passphrase is incorrect'));
        cb();
        return false;
    }

    Session.setAuth('personalWallet', personal_wallet);
    Session.setAuth('v3json', $('#unlockWalletJson').val());
    Session.setAuth('personalWalletCreated', true);
    Session.setAuth('walletAddress', personal_wallet.getAddressString());

    generateWeb3WalletEngineProvider(personal_wallet, () => {
        signatureAuth(function(error) {
            if (error) {
                modalAlert(TAPi18n.__('Oops!'), TAPi18n.__(error.reason));
                cb();
                return false;
            }
            Session.set('broadcast', new Date().getTime());
            cb();
            Router.go(Session.get('previousLocationPath') && Session.get('previousLocationPath') != null ? Session.get('previousLocationPath') : '/');
            return null;
        });
        return null;
    });
    return null;
};


export const loadWeb3 = (resolve = () => {}, reject = () => {}) => {
    switch (Session.get('walletWay')) {
    case 'unlockWalet':
    case 'createWalet':
        if (_.isUndefined(Session.get('personalWallet'))) {
            reject();
        } else {
            generateWeb3WalletEngineProvider(ETHWallet.fromPrivateKey(Buffer.from(Session.get('personalWallet')._privKey)), function() {
                initializeContact('HMW').then(() => resolve());
            });
        }
        break;
        /*
    case 'trezorWalet':
        generateWeb3EngineTrezorProvider(function() {
            initializeContact('HMW').then(() => resolve());
        });
        break;
        */
        /*
    case 'ledgerWalet':
        generateWeb3EngineLedgerProvider(function() {
            initializeContact('HMW').then(() => resolve());
        });
        break;
        */
    case 'metamask':
        if (window.ethereum) {
            window.ethereum.enable().then(() => {
                initializeContact('HMW')
                    .then(() => resolve());
            }).catch(() => reject());
        } else {
            initializeContact('HMW')
                .then(() => resolve());
        }
        break;
    default:
        reject();
        break;
    }
    return null;
};

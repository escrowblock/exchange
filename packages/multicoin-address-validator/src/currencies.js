var XRPValidator = require('./ripple_validator');
var REGEXPValidator = require('./regexp_validator');
var ETHValidator = require('./ethereum_validator');
var BTCValidator = require('./bitcoin_validator');
var ADAValidator = require('./ada_validator');
var XMRValidator = require('./monero_validator');
var NANOValidator = require('./nano_validator');
var SCValidator  = require('./siacoin_validator');
var BASE58Validator = require('./base58_validator');
var TRXValidator = require('./tron_validator');
var NEMValidator = require('./nem_validator');
var LSKValidator = require('./lisk_validator');
var BCHValidator = require('./bch_validator');
var XLMValidator = require('./stellar_validator');

// defines P2PKH and P2SH address types for standard (prod) and testnet networks
var CURRENCIES = [{
    name: 'Bitcoin',
    symbol: 'btc',
    addressTypes: { prod: ['00', '05'], testnet: ['6f', 'c4', '3c', '26']},
    validator: BTCValidator
}, {
    name: 'BitcoinCash',
    symbol: 'bch',
    regexp: '^[qQpP]{1}[0-9a-zA-Z]{41}$',
    addressTypes: { prod: ['00', '05'], testnet: ['6f', 'c4'] },
    validator: BCHValidator
}, {
    name: 'BitcoinCashABC',
    symbol: 'bchabc',
    regexp: '^[qQpP]{1}[0-9a-zA-Z]{41}$',
    addressTypes: { prod: ['00', '05'], testnet: ['6f', 'c4'] },
    validator: BCHValidator
}, 
{
    name: 'Bitcoin SV',
    symbol: 'bsv',
    regexp: '^[qQ]{1}[0-9a-zA-Z]{41}$',
    addressTypes: { prod: ['00', '05'], testnet: ['6f', 'c4'] },
    validator: BCHValidator
},
{
    name: 'LiteCoin',
    symbol: 'ltc',
    addressTypes: { prod: ['30', '05', '32'], testnet: ['6f', 'c4', '3a'] },
    validator: BTCValidator
}, {
    name: 'PeerCoin',
    symbol: 'ppc',
    addressTypes: { prod: ['37', '75'], testnet: ['6f', 'c4'] },
    validator: BTCValidator
}, {
    name: 'DogeCoin',
    symbol: 'doge',
    addressTypes: { prod: ['1e', '16'], testnet: ['71', 'c4'] },
    validator: BTCValidator
}, {
    name: 'BeaverCoin',
    symbol: 'bvc',
    addressTypes: { prod: ['19', '05'], testnet: ['6f', 'c4'] },
    validator: BTCValidator,
}, {
    name: 'FreiCoin',
    symbol: 'frc',
    addressTypes: { prod: ['00', '05'], testnet: ['6f', 'c4'] },
    validator: BTCValidator
}, {
    name: 'ProtoShares',
    symbol: 'pts',
    addressTypes: { prod: ['38', '05'], testnet: ['6f', 'c4'] },
    validator: BTCValidator
}, {
    name: 'MegaCoin',
    symbol: 'mec',
    addressTypes: { prod: ['32', '05'], testnet: ['6f', 'c4'] },
    validator: BTCValidator
}, {
    name: 'PrimeCoin',
    symbol: 'xpm',
    addressTypes: { prod: ['17', '53'], testnet: ['6f', 'c4'] },
    validator: BTCValidator
}, {
    name: 'AuroraCoin',
    symbol: 'aur',
    addressTypes: { prod: ['17', '05'], testnet: ['6f', 'c4'] },
    validator: BTCValidator
}, {
    name: 'NameCoin',
    symbol: 'nmc',
    addressTypes: { prod: ['34'], testnet: [] },
    validator: BTCValidator
}, {
    name: 'BioCoin',
    symbol: 'bio',
    addressTypes: { prod: ['19', '14'], testnet: ['6f', 'c4'] },
    validator: BTCValidator
}, {
    name: 'GarliCoin',
    symbol: 'grlc',
    addressTypes: { prod: ['26', '05'], testnet: ['6f', 'c4'] },
    validator: BTCValidator
}, {
    name: 'VertCoin',
    symbol: 'vtc',
    addressTypes: { prod: ['0x', '47', '71', '05'], testnet: ['6f', 'c4'] },
    validator: BTCValidator
    
}, {
    name: 'BitcoinGold',
    symbol: 'btg',
    addressTypes: { prod: ['26', '17'], testnet: ['6f', 'c4'] },
    validator: BTCValidator
}, {
    name: 'Komodo',
    symbol: 'kmd',
    addressTypes: { prod: ['3c', '55'], testnet: ['0', '5'] },
    validator: BTCValidator
}, {
    name: 'BitcoinZ',
    symbol: 'btcz',
    expectedLength: 26,
    addressTypes: { prod: ['1cb8', '1cbd'], testnet: ['1d25', '1cba'] },
    validator: BTCValidator
}, {
    name: 'BitcoinPrivate',
    symbol: 'btcp',
    expectedLength: 26,
    addressTypes: { prod: ['1325', '13af'], testnet: ['1957', '19e0'] },
    validator: BTCValidator
}, {
    name: 'Hush',
    symbol: 'hush',
    expectedLength: 26,
    addressTypes: { prod: ['1cb8', '1cbd'], testnet: ['1d25', '1cba'] },
    validator: BTCValidator
}, {
    name: 'SnowGem',
    symbol: 'sng',
    expectedLength: 26,
    addressTypes: { prod: ['1c28', '1c2d'], testnet: ['1d25', '1cba'] },
    validator: BTCValidator
}, {
    name: 'ZCash',
    symbol: 'zec',
    expectedLength: 26,
    addressTypes: { prod: ['1cb8', '1cbd'], testnet: ['1d25', '1cba'] },
    validator: BTCValidator
}, {
    name: 'ZClassic',
    symbol: 'zcl',
    expectedLength: 26,
    addressTypes: { prod: ['1cb8', '1cbd'], testnet: ['1d25', '1cba'] },
    validator: BTCValidator
}, {
    name: 'ZenCash',
    symbol: 'zen',
    expectedLength: 26,
    addressTypes: { prod: ['2089', '2096'], testnet: ['2092', '2098'] },
    validator: BTCValidator
}, {
    name: 'VoteCoin',
    symbol: 'vot',
    expectedLength: 26,
    addressTypes: { prod: ['1cb8', '1cbd'], testnet: ['1d25', '1cba'] },
    validator: BTCValidator
}, {
    name: 'Decred',
    symbol: 'dcr',
    addressTypes: { prod: ['073f', '071a'], testnet: ['0f21', '0efc'] },
    hashFunction: 'blake256',
    expectedLength: 26,
    validator: BTCValidator
}, {
    name: 'GameCredits',
    symbol: 'game',
    addressTypes: { prod: ['26', '05'], testnet: [] },
    validator: BTCValidator
}, {
    name: 'PIVX',
    symbol: 'pivx',
    addressTypes: { prod: ['1e', '0d'], testnet: [] },
    validator: BTCValidator
}, {
    name: 'SolarCoin',
    symbol: 'slr',
    addressTypes: { prod: ['12', '05'], testnet: [] },
    validator: BTCValidator
}, {
    name: 'MonaCoin',
    symbol: 'mona',
    addressTypes: { prod: ['32', '37'], testnet: [] },
    validator: BTCValidator
}, {
    name: 'DigiByte',
    symbol: 'dgb',
    addressTypes: { prod: ['1e'], testnet: [] },
    validator: BTCValidator
}, {
    name: 'Tether',
    symbol: 'usdt',
    addressTypes: { prod: ['00', '05'], testnet: ['6f', 'c4'] },
    validator: BTCValidator
}, {
    name: 'HyperCash',
    symbol: 'hc',
    validator: BTCValidator,
}, {
    name: 'Ripple',
    symbol: 'xrp',
    validator: XRPValidator,
}, {
    name: 'Dash',
    symbol: 'dash',
    addressTypes: { prod: ['4c', '10'], testnet: ['8c', '13'] },
    validator: BTCValidator
}, {
    name: 'Neo',
    symbol: 'neo',
    addressTypes: { prod: ['17'], testnet: [] },
    validator: BTCValidator
}, {
    name: 'NeoGas',
    symbol: 'gas',
    addressTypes: { prod: ['17'], testnet: [] },
    validator: BTCValidator
}, {
    name: 'Qtum',
    symbol: 'qtum',
    addressTypes: { prod: ['3a', '32'], testnet: ['78', '6e'] },
    validator: BTCValidator
}, {
    name: 'Bitcoin Diamond',
    symbol: 'BCD',
    validator: BTCValidator
}, {
    name: 'Waves',
    symbol: 'waves',
    addressTypes: { prod: ['0157'], testnet: ['0154'] },
    expectedLength: 26,
    hashFunction: 'blake256keccak256',
    regex: /^[a-zA-Z0-9]{35}$/,
    validator: BTCValidator
}, {
    name: 'ZCoin',
    symbol: 'xzc',
    validator: BASE58Validator,
}, {
    name: 'Nebulas',
    symbol: 'nas',
    validator: BASE58Validator,
}, {
    name: 'Verge',
    symbol: 'xvg',
    validator: BASE58Validator,
}, {
    name: 'Ontology Gas',
    symbol: 'ong',
    validator: BASE58Validator,
}, {
    name: 'Ontology',
    symbol: 'ont',
    validator: BASE58Validator,
}, {
    name: 'IOST',
    symbol: 'iost',
    validator: BASE58Validator,
}, {
    name: 'Ethereum',
    symbol: 'eth',
    validator: ETHValidator,
}, {
    name: 'Zilliqa',
    symbol: 'zil',
    validator: ETHValidator,
}, {
    name: 'Ren',
    symbol: 'ren',
    validator: ETHValidator,
}, {
    name: 'OST',
    symbol: 'ost',
    validator: ETHValidator,
}, {
    name: 'Blocktrade Token',
    symbol: 'btt',
    validator: ETHValidator,
}, {
    name: 'Celer Network',
    symbol: 'celr',
    validator: ETHValidator,
}, {
    name: 'Paxos Standard Token',
    symbol: 'pax',
    validator: ETHValidator,
}, {
    name: 'Time new bank',
    symbol: 'tnb',
    validator: ETHValidator,
}, {
    name: 'DigixDAO',
    symbol: 'dgd',
    validator: ETHValidator,
}, {
    name: 'QuarkChain',
    symbol: 'qkc',
    validator: ETHValidator,
}, {
    name: 'Waltonchain',
    symbol: 'wtc',
    validator: ETHValidator,
}, {
    name: 'Wanchain',
    symbol: 'wan',
    validator: ETHValidator,
}, { 
    name: 'Dock',
    symbol: 'dock',
    validator: ETHValidator,
}, { 
    name: 'Aelf',
    symbol: 'elf',
    validator: ETHValidator,
}, { 
    name: 'VeChain',
    symbol: 'vet',
    validator: ETHValidator,
}, {
    name: 'Enjin Coin',
    symbol: 'enj',
    validator: ETHValidator,
}, {
    name: 'Raiden Network Token',
    symbol: 'rdn',
    validator: ETHValidator,
}, {
    name: 'Tail',
    symbol: 'wabi',
    validator: ETHValidator,
}, {
    name: 'USDCoin',
    symbol: 'usdc',
    validator: ETHValidator,
}, {
    name: 'THETA',
    symbol: 'theta',
    validator: ETHValidator,
}, {
    name: 'Metal',
    symbol: 'mtl',
    validator: ETHValidator,
}, {
    name: 'Pundi X',
    symbol: 'npxs',
    validator: ETHValidator,
}, {
    name: 'IoTeX',
    symbol: 'iotx',
    validator: ETHValidator,
}, {
    name: 'Crypto.com',
    symbol: 'mco',
    validator: ETHValidator,
}, {
    name: 'Aeternity',
    symbol: 'ae',
    regex: /^ak_[a-zA-Z0-9]*$/,
    validator: BASE58Validator,
}, {
    name: 'EOS',
    symbol: 'eos',
    regex: /^[\.a-z0-5]{12}$/,
    validator: REGEXPValidator
}, {
    name: 'Ravecoin',
    symbol: 'rvn',
    regex: /^R[A-Za-z0-9]*$/,
    validator: REGEXPValidator
}, {
    name: 'NULS',
    symbol: 'nuls',
    regex: /^NULS[A-Za-z0-9]*$/,
    validator: REGEXPValidator
}, {
    name: 'IOTA',
    symbol: 'miota',
    regex: /^[A-Z0-9]*$/,
    validator: REGEXPValidator
}, {
    name: 'Icon',
    symbol: 'icx',
    regex: /^hx[a-z0-9]{40}$/,
    validator: REGEXPValidator
}, {
    name: 'Decentraland',
    symbol: 'mana',
    validator: ETHValidator,
}, {
    name: 'EscrowBlock',
    symbol: 'escb',
    validator: ETHValidator,
}, {
    name: 'Insolar',
    symbol: 'ins',
    validator: ETHValidator,
}, {
    name: 'Loom network',
    symbol: 'loom',
    validator: ETHValidator,
}, {
    name: 'Mithril',
    symbol: 'mith',
    validator: ETHValidator,
}, {
    name: 'Moeda Loyalty Points',
    symbol: 'mda',
    validator: ETHValidator,
}, {
    name: 'Mainframe',
    symbol: 'mft',
    validator: ETHValidator,
}, {
    name: 'Everex',
    symbol: 'evx',
    validator: ETHValidator,
}, {
    name: 'GoChain',
    symbol: 'go',
    validator: ETHValidator,
}, {
    name: 'Chainlin',
    symbol: 'link',
    validator: ETHValidator,
}, {
    name: 'Gifto',
    symbol: 'gto',
    validator: ETHValidator,
}, {
    name: 'GXChain',
    symbol: 'gxc',
    validator: ETHValidator,
}, {
    name: 'Fetch',
    symbol: 'fet',
    validator: ETHValidator,
}, {
    name: 'EtherZero',
    symbol: 'etz',
    validator: ETHValidator,
}, {
    name: 'EthereumClassic',
    symbol: 'etc',
    validator: ETHValidator,
}, {
    name: 'Callisto',
    symbol: 'clo',
    validator: ETHValidator,
}, {
    name: 'Bankex',
    symbol: 'bkx',
    validator: ETHValidator
}, {
    name: 'Cardano',
    symbol: 'ada',
    validator: ADAValidator
}, {
    name: 'Monero',
    symbol: 'xmr',
    addressTypes: { prod: ['18'], testnet: ['53'] },
    iAddressTypes: { prod: ['19'], testnet: ['54'] },
    validator: XMRValidator
}, {
    name: 'Aragon',
    symbol: 'ant',
    validator: ETHValidator
}, {
    name: 'Basic Attention Token',
    symbol: 'bat',
    validator: ETHValidator
}, {
    name: 'Bancor',
    symbol: 'bnt',
    validator: ETHValidator
}, {
    name: 'Civic',
    symbol: 'cvc',
    validator: ETHValidator
}, {
    name: 'District0x',
    symbol: 'dnt',
    validator: ETHValidator
}, {
    name: 'Gnosis',
    symbol: 'gno',
    validator: ETHValidator
}, {
    name: 'BlockMason Credit Protocol',
    symbol: 'bcpt',
    validator: ETHValidator
}, {
    name: 'Binance',
    symbol: 'bnb',
    validator: ETHValidator
}, {
    name: 'Golem',
    symbol: 'gnt',
    validator: ETHValidator
}, {
    name: 'Matchpool',
    symbol: 'gup',
    validator: ETHValidator
}, {
    name: 'Melon',
    symbol: 'mln',
    validator: ETHValidator
}, {
    name: 'Numeraire',
    symbol: 'nmr',
    validator: ETHValidator
}, {
    name: 'OmiseGO',
    symbol: 'omg',
    validator: ETHValidator
}, {
    name: 'SingularityNET',
    symbol: 'agi',
    validator: ETHValidator
}, {
    name: 'Aion',
    symbol: 'aion',
    regex: /^0xa[a-f\d]{63}$/ig,
    validator: REGEXPValidator
}, {
    name: 'Ambrosus',
    symbol: 'amb',
    validator: ETHValidator
}, {
    name: 'Aeron',
    symbol: 'arn',
    validator: ETHValidator
}, {
    name: 'AirSwap',
    symbol: 'ast',
    validator: ETHValidator
},
{
    name: 'TenX',
    symbol: 'pay',
    validator: ETHValidator
}, {
    name: 'Ripio Credit Network',
    symbol: 'rcn',
    validator: ETHValidator
}, {
    name: 'Augur',
    symbol: 'rep',
    validator: ETHValidator
}, {
    name: 'iExec RLC',
    symbol: 'rlc',
    validator: ETHValidator
}, {
    name: 'Salt',
    symbol: 'salt',
    validator: ETHValidator
}, {
    name: 'Status',
    symbol: 'snt',
    validator: ETHValidator
}, {
    name: 'Storj',
    symbol: 'storj',
    validator: ETHValidator
}, {
    name: 'Swarm City',
    symbol: 'swt',
    validator: ETHValidator
}, {
    name: 'TrueUSD',
    symbol: 'tusd',
    validator: ETHValidator
}, {
    name: 'Wings',
    symbol: 'wings',
    validator: ETHValidator
}, {
    name: '0x',
    symbol: 'zrx',
    validator: ETHValidator
}, {
    name: 'Expanse',
    symbol: 'exp',
    validator: ETHValidator
}, {
    name: 'Viberate',
    symbol: 'vib',
    validator: ETHValidator
}, {
    name: 'Odyssey',
    symbol: 'ocn',
    validator: ETHValidator
}, {
    name: 'Polymath',
    symbol: 'poly',
    validator: ETHValidator
}, {
    name: 'Storm',
    symbol: 'storm',
    validator: ETHValidator
}, {
    name: 'Nano',
    symbol: 'nano',
    validator: NANOValidator,
}, {
    name: 'RaiBlocks',
    symbol: 'xrb',
    validator: NANOValidator,
}, {
    name: 'siacoin',
    symbol: 'sc',
    validator: SCValidator
}, {
    name: 'hyperspace',
    symbol: 'xsc',
    validator: SCValidator
}, {
    name: 'Syscoin',
    symbol: 'sys',
    validator: SCValidator
}, {
    name: 'loki',
    symbol: 'loki',
    addressTypes: { prod: ['114', '116'], testnet: [] },
    iAddressTypes: { prod: ['115'], testnet: [] },
    validator: XMRValidator
}, {
    name: 'lbry',
    symbol: 'lbc',
    addressTypes: { prod: ['55'], testnet: [] },
    validator: BTCValidator
}, {
    name: 'tron',
    symbol: 'trx',
    addressTypes: {prod: [0x41], testnet: [0xa0]},
    validator: TRXValidator
}, {
    name: 'nem',
    symbol: 'xem',
    validator: NEMValidator
}, {
    name: 'lisk',
    symbol: 'lsk',
    validator: LSKValidator
}, {
    name: 'stellar',
    symbol: 'xlm',
    validator: XLMValidator,
}];


module.exports = {
    getByNameOrSymbol: function (currencyNameOrSymbol) {
        var nameOrSymbol = currencyNameOrSymbol.toLowerCase();
        return CURRENCIES.find(function (currency) {
            return currency.name.toLowerCase() === nameOrSymbol || currency.symbol.toLowerCase() === nameOrSymbol;
        });
    }
};

//spit out details for readme.md
// CURRENCIES
//     .sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1)
//     .forEach(c => console.log(`* ${c.name}/${c.symbol} \`'${c.name}'\` or \`'${c.symbol}'\` `));


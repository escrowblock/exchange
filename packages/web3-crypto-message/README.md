# web3-crypto-message

Simple encrypted messaging between many web3 users

## Functions

### Install

```bash
  meteor add escb:web3-crypto-message
```

```javascript

import cryptoMsg from 'meteor/escb:web3-crypto-message';

```

## API

- [createIdentity()](#createidentity)
- [publicKeyByPrivateKey()](#publickeybyprivatekey)
- [publicKey.toAddress()](#publickeytoaddress)
- [publicKey.compress()](#publickeycompress)
- [publicKey.decompress()](#publickeydecompress)
- [sign()](#sign)
- [recover()](#recover)
- [recoverPublicKey()](#recoverpublickey)
- [encryptWithPublicKey()](#encryptwithpublickey)
- [decryptWithPrivateKey()](#decryptwithprivatekey)
- [cipher.stringify()](#cipherstringify)
- [cipher.parse()](#cipherparse)
- [hex.compress() hex.decompress()](#hex-compressdecompress)
### createIdentity()

Creates a new ethereum-identity with privateKey, publicKey and address as hex-string.

```javascript
  const identity = cryptoMsg.createIdentity();
  /* > {
      address: '0x3f243FdacE01Cfd9719f7359c94BA11361f32471',
      privateKey: '0x107be946709e41b7895eea9f2dacf998a0a9124acbb786f0fd1a826101581a07',
      publicKey: 'bf1cc3154424dc22191941d9f4f50b063a2b663a2337e5548abea633c1d06ece...'
  } */
```

You can also create an identity by providing your own entropy-buffer. Use this with caution, a bad entropy can result in an unsecure private key.

```javascript
  const entropy = Buffer.from('f2dacf...', 'utf-8'); // must contain at least 128 chars
  const identity = cryptoMsg.createIdentity(entropy);
  /* > {
      address: '0x59c8d4d645B0a3b230DE368d815ebDE372d37Ea8',
      privateKey: '0x18cea40e44624867ddfd775b2898cdb2da29b4be92ee072b9eb02d43b6f2473a',
      publicKey: '991ce4643653ef452327ee3d1a56af19c84599d340ffd427e784...'
  } */
```

### publicKeyByPrivateKey()

Derives the publicKey from a privateKey and returns it as hex-string.

```javascript
  const publicKey = cryptoMsg.publicKeyByPrivateKey(
      '0x107be946709e41b7895eea9f2dacf998a0a9124acbb786f0fd1a826101581a07'
  );
  // > 'bf1cc3154424dc22191941d9f4f50b063a2b663a2337e5548abea633c1d06ece...'
```

### publicKey.toAddress()

Derives the ethereum-address from the publicKey.

```javascript
  const address = cryptoMsg.publicKey.toAddress(
      'bf1cc3154424dc22191941d9f4f50b063a2b663a2337e5548abea633c1d06ece...'
  );
  // > '0x3f243FdacE01Cfd9719f7359c94BA11361f32471'
```

### publicKey.compress()

Compresses an uncompressed publicKey.

```javascript
  const address = cryptoMsg.publicKey.compress(
      '04a34d6aef3eb42335fb3cacb59...'
  );
  // > '03a34d6aef3eb42335fb3cacb59478c0b44c0bbeb8bb4ca427dbc7044157a5d24b' // compressed keys start with '02' or '03'
```

### publicKey.decompress()

Decompresses a compressed publicKey.

```javascript
  const address = cryptoMsg.publicKey.decompress(
      '03a34d6aef3eb42335fb3c...'
  );
  // > 'a34d6aef3eb42335fb3cacb5947' // non-compressed keys start with '04' or no prefix
```

### sign()

Signs the hash with the privateKey. Returns the signature as hex-string.

```javascript
  const message = 'foobar';
  const messageHash = cryptoMsg.hash.keccak256(message);
  const signature = cryptoMsg.sign(
      '0x107be946709e41b7895eea9f2dacf998a0a9124acbb786f0fd1a826101581a07', // privateKey
      messageHash // hash of message
  );
  // > '0xc04b809d8f33c46ff80c44ba58e866ff0d5..'
```

### recover()

Recovers the signers address from the signature.

```javascript
    const signer = cryptoMsg.recover(
      '0xc04b809d8f33c46ff80c44ba58e866ff0d5..',
      cryptoMsg.hash.keccak256('foobar') // signed message hash
  );
  // > '0x3f243FdacE01Cfd9719f7359c94BA11361f32471'
```

### recoverPublicKey()

Recovers the signers `publicKey` from the signature.
```javascript
    const signer = cryptoMsg.recoverPublicKey(
      '0xc04b809d8f33c46ff80c44ba58e866ff0d5..', // signature
      cryptoMsg.hash.keccak256('foobar') // message hash
  );
  // > 'bf1cc3154424dc22191941d9f4f50b063a2b663a2337e5548abea633c1d06ece..'
```


### encryptWithPublicKey()

Encrypts the message with the publicKey so that only the corresponding privateKey can decrypt it. Returns (async) the encrypted data as object with hex-strings.

```javascript
    const encrypted = await cryptoMsg.encryptWithPublicKey(
        'bf1cc3154424dc22191941d9f4f50b063a2b663a2337e5548abea633c1d06ece...', // publicKey
        'foobar' // message
    );
    /* >  {
            iv: '02aeac54cb45283b427bd1a5028552c1',
            ephemPublicKey: '044acf39ed83c304f19f41ea66615d7a6c0068d5fc48ee181f2fb1091...',
            ciphertext: '5fbbcc1a44ee19f7499dbc39cfc4ce96',
            mac: '96490b293763f49a371d3a2040a2d2cb57f246ee88958009fe3c7ef2a38264a1'
        } */
```

### decryptWithPrivateKey()

Decrypts the encrypted data with the privateKey. Returns (async) the message as string.

```javascript
    const message = await cryptoMsg.decryptWithPrivateKey(
        '0x107be946709e41b7895eea9f2dacf998a0a9124acbb786f0fd1a826101581a07', // privateKey
        {
            iv: '02aeac54cb45283b427bd1a5028552c1',
            ephemPublicKey: '044acf39ed83c304f19f41ea66615d7a6c0068d5fc48ee181f2fb1091...',
            ciphertext: '5fbbcc1a44ee19f7499dbc39cfc4ce96',
            mac: '96490b293763f49a371d3a2040a2d2cb57f246ee88958009fe3c7ef2a38264a1'
        } // encrypted-data
    );
    // 'foobar'
```

### cipher.stringify()

Transforms the object with the encrypted data into a smaller string-representation.

```javascript
const str = cryptoMsg.cipher.stringify({
    iv: '02aeac54cb45283b427bd1a5028552c1',
    ephemPublicKey: '044acf39ed83c304f19f41ea66615d7a6c0068d5fc48ee181f2fb1091...',
    ciphertext: '5fbbcc1a44ee19f7499dbc39cfc4ce96',
    mac: '96490b293763f49a371d3a2040a2d2cb57f246ee88958009fe3c7ef2a38264a1'
});
// > '59ab06532fc965b0107977f43e69e5a4038db32099dab281c8f5aece2852...'
```

### cipher.parse()

Parses the string-representation back into the encrypted object.

```javascript
const str = cryptoMsg.cipher.parse('59ab06532fc965b0107977f43e69e5a4038db32099dab281c8f5aece2852...');
/* >  {
        iv: '02aeac54cb45283b427bd1a5028552c1',
        ephemPublicKey: '044acf39ed83c304f19f41ea66615d7a6c0068d5fc48ee181f2fb1091...',
        ciphertext: '5fbbcc1a44ee19f7499dbc39cfc4ce96',
        mac: '96490b293763f49a371d3a2040a2d2cb57f246ee88958009fe3c7ef2a38264a1'
    } */
```

### hex compress/decompress

Compress or decompress a hex-string to make it smaller. You can either compress to utf16 which reduces the size to about 1/4, or to base64 which reduces the size to about 4/5.

```javascript
const hexString = '0x107be946709e41b7895eea9f2dacf998a0a9124acbb786f0fd1a826101581a07'; // 66 chars

const utf16 = cryptoMsg.hex.compress(hexString); // compress to utf16
// > 'ၻ炞䆷襞ⶬ輦ꂩቊ쮷蛰ﴚ艡Řᨇ' // 16 chars

const base64 = cryptoMsg.hex.compress(hexString, true); // compress to base64
// > 'EHvpRnCeQbeJXuqfLaz5mKCpEkrLt4bw/RqCYQFYGgc=' // 44 chars

cryptoMsg.hex.decompress(utf16); // decompress from utf16
// > '0x107be946709e41b7895eea9f2d...'

cryptoMsg.hex.decompress(base64, true); // decompress from base64
// > '0x107be946709e41b7895eea9f2d...'

```

## Credits

Slightly optimized for messaging needs version of this https://github.com/pubkey/eth-crypto
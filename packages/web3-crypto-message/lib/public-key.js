import {
    publicKeyConvert,
} from 'secp256k1';

import {
    pubToAddress,
    toChecksumAddress,
} from 'ethereumjs-util';

export function compress(startsWith04) {
    // add trailing 04 if not done before
    const testBuffer = Buffer.from(startsWith04, 'hex');
    if (testBuffer.length === 64) startsWith04 = `04${startsWith04}`;


    return publicKeyConvert(
        Buffer.from(startsWith04, 'hex'),
        true,
    ).toString('hex');
}

export function decompress(startsWith02Or03) {
    // if already decompressed an not has trailing 04
    const testBuffer = Buffer.from(startsWith02Or03, 'hex');
    if (testBuffer.length === 64) startsWith02Or03 = `04${startsWith02Or03}`;

    let decompressed = publicKeyConvert(
        Buffer.from(startsWith02Or03, 'hex'),
        false,
    ).toString('hex');

    // remove trailing 04
    decompressed = decompressed.substring(2);
    return decompressed;
}

/**
 * generates the ethereum-adress of the publicKey
 * We create the checksum-adress which is case-sensitive
 * @returns {string} address
 */
export function toAddress(publicKey) {
    // normalize key
    publicKey = decompress(publicKey);

    const addressBuffer = pubToAddress(Buffer.from(publicKey, 'hex'));
    const checkSumAdress = toChecksumAddress(addressBuffer.toString('hex'));
    return checkSumAdress;
}

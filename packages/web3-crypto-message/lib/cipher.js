export function stringify(cipher) {
    if (typeof cipher === 'string') return cipher;

    const ret = Buffer.concat([
        Buffer.from(cipher.version), // 24bit
        Buffer.from(cipher.nonce, 'base64'), // 32bit
        Buffer.from(cipher.ephemPublicKey, 'base64'), // 44bit
        Buffer.from(cipher.ciphertext, 'base64'), // var bit
    ]);

    return ret.toString('hex');
}
  
export function parse(str) {
    if (typeof str !== 'string') {
        return str;
    }
    
    const buf = Buffer.from(str, 'hex');

    const ret = {
        version: buf.toString('utf8', 0, 24),
        nonce: buf.toString('base64', 24, 48),
        ephemPublicKey: buf.toString('base64', 48, 80),
        ciphertext: buf.toString('base64', 80, buf.length),
    };

    return ret;
}

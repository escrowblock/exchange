import sigUtil from 'eth-sig-util';
import {
    stringify,
} from './cipher';

export default function encryptWithPublicKey(publicKey, message) {
    return stringify(sigUtil.encrypt(publicKey, {'data': message}, 'x25519-xsalsa20-poly1305'));
}

import sigUtil from 'eth-sig-util';
import {
  parse
} from './cipher';
import { removeTrailing0x } from './util';
export default function decryptWithPrivateKey(privateKey, encrypted) {
    return sigUtil.decrypt(parse(removeTrailing0x(encrypted)), privateKey);
}

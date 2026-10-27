import MCR from './src/index.js';
import * as cipherCore from './src/cipher/index.js';
import * as kdfCore from './src/kdf/index.js';

const key = kdfCore.generateKey(32);
console.log('key:', key);
const plaintext = 'test';
try {
  const encStr = cipherCore.encrypt(plaintext, { key });
  console.log('cipherCore.encStr:', encStr);
  const encrypted = MCR.cipher.encrypt(plaintext, { key });
  console.log('MCR.cipher.encrypted:', encrypted);
} catch (e) {
  console.error(e);
}
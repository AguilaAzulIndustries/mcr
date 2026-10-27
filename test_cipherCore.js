import { encrypt } from './src/cipher/aes-gcm.js';
import { generateKey } from './src/kdf/index.js';

const key = generateKey(32);
console.log('key:', key);
const plaintext = 'test';
try {
  const result = encrypt(plaintext, { key });
  console.log('enc result:', result);
} catch (e) {
  console.error(e);
}

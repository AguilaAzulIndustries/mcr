import MCR from './src/index.js';

const key = MCR.kdf.generateKey(32);
console.log('key:', key);
const plaintext = 'test';
try {
  const result = MCR.cipher.encrypt(plaintext, { key });
  console.log('enc result:', result);
} catch (e) {
  console.error(e);
}

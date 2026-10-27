import MCR from './src/index.js';

const key = MCR.kdf.generateKey(32);
const plaintext = 'Hello World';
const { encrypted } = MCR.cipher.encrypt(plaintext, { key });
console.log('Encrypted:', encrypted);
const decrypted = MCR.cipher.decrypt(encrypted, { key });
console.log('Decrypted:', decrypted.toString('utf8'));

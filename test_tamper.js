import { keys } from './src/index.js';
import { parse } from './src/core/format.js';
import { decodeBase64URL } from './src/core/encoding.js';

const keyPair = keys.generateKeyPair();
const data = 'tamper me';
const signature = keys.signData(data, { privateKey: keyPair.privateKey });
console.log('Original signature:', signature);

// Tamper with the signature string (last character)
const tampered = signature.slice(0, -1) + 'x';
console.log('Tampered signature:', tampered);

const verified = keys.verifySignature(data, tampered, { publicKey: keyPair.publicKey });
console.log('Verification result:', verified);

// Let's also see what the signature looks like when parsed
const parsed = parse(signature);
console.log('Parsed signature part:', parsed.parts[0]);
const parsedTampered = parse(tampered);
console.log('Parsed tampered part:', parsedTampered.parts[0]);

// And decode them
const sigBuf = decodeBase64URL(parsed.parts[0]);
const tamperedBuf = decodeBase64URL(parsedTampered.parts[0]);
console.log('Signature buffer length:', sigBuf.length);
console.log('Tampered buffer length:', tamperedBuf.length);
console.log('Buffers equal:', sigBuf.equals(tamperedBuf));
if (!sigBuf.equals(tamperedBuf)) {
  console.log('Signature hex:', sigBuf.toString('hex'));
  console.log('Tampered hex:', tamperedBuf.toString('hex'));
}
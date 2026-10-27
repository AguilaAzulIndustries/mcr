import { keys } from './src/index.js';

const keyPair = keys.generateKeyPair();
const data = 'tamper me';
const signature = keys.signData(data, { privateKey: keyPair.privateKey });
console.log('Original signature:', signature);
console.log('Signature length:', signature.length);
console.log('Last char:', signature.slice(-1));
console.log('Second last char:', signature.slice(-2, -1));

// Tamper with the signature string (last character)
const tampered = signature.slice(0, -1) + 'x';
console.log('Tampered signature:', tampered);
console.log('Tampered length:', tampered.length);
console.log('Tampered last char:', tampered.slice(-1));

const verified = keys.verifySignature(data, tampered, { publicKey: keyPair.publicKey });
console.log('Verified:', verified);

// Also verify original
const verifiedOrig = keys.verifySignature(data, signature, { publicKey: keyPair.publicKey });
console.log('Verified original:', verifiedOrig);

// Let's also see what the signature looks like when parsed
const { parse } = require('./src/core/format.js');
const parsed = parse(signature);
console.log('Parsed algorithm:', parsed.algorithm);
console.log('Parsed parts:', parsed.parts);
const { decodeBase64URL } = require('./core/encoding.js');
const sigBuf = decodeBase64URL(parsed.parts[0]);
console.log('Signature buffer length:', sigBuf.length);
console.log('Signature buffer hex:', sigBuf.toString('hex'));

const parsedTampered = parse(tampered);
console.log('Tampered parsed parts:', parsedTampered.parts);
const tamperedBuf = decodeBase64URL(parsedTampered.parts[0]);
console.log('Tampered buffer length:', tamperedBuf.length);
console.log('Tampered buffer hex:', tamperedBuf.toString('hex'));

// Are they equal?
console.log('Buffers equal:', sigBuf.equals(tamperedBuf));
if (!sigBuf.equals(tamperedBuf)) {
  // find first differing byte
  for (let i = 0; i < sigBuf.length; i++) {
    if (sigBuf[i] !== tamperedBuf[i]) {
      console.log(`First diff at byte ${i}: ${sigBuf[i]} vs ${tamperedBuf[i]}`);
      break;
    }
  }
}

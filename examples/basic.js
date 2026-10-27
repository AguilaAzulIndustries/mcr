// Example: Basic usage of MCR library
import { random, hash, cipher, kdf, keys } from '../src/index.js';

// 1. Random generation
console.log('=== Random ===');
const randomBytes = random.bytes(16);
console.log('Random bytes (16):', randomBytes.toString('hex'));
const randomToken = random.token(16);
console.log('Random token:', randomToken);
const randomTokenHex = random.tokenHex(16);
console.log('Random tokenHex:', randomTokenHex);

// 2. SHA-256 hashing
console.log('\n=== SHA-256 Hashing ===');
const data = 'Hello, World!';
const hashHex = hash.sha256(data);
console.log(`SHA-256 of "${data}" (hex):`, hashHex);
const hashBase64url = hash.sha256(data, { encoding: 'base64url' });
console.log(`SHA-256 of "${data}" (base64url):`, hashBase64url);

// 3. Password hashing
console.log('\n=== Password Hashing ===');
const passwordValue = 'mySecretPassword';
(async () => {
  const hashed = await hash.password.hash(passwordValue);
  console.log(`Hashed password:`, hashed);

  const match = await hash.password.verify(passwordValue, hashed);
  console.log(`Password matches:`, match);

  const wrongMatch = await hash.password.verify('wrongPassword', hashed);
  console.log(`Wrong password matches:`, wrongMatch);
})();

// 4. Encryption (AES-256-GCM)
console.log('\n=== Encryption ===');
const plaintext = 'This is a secret message.';
const associatedData = 'authenticated but not encrypted data';
const key = kdf.generateKey(32); // 256-bit key for AES-256
console.log('Key type:', typeof key);
console.log('Key is Buffer:', key instanceof Buffer);
console.log('Key length:', key.length);

(async () => {
  try {
    const encrypted = cipher.encrypt(plaintext, { key, associatedData });
    console.log(`Plaintext:`, plaintext);
    console.log(`Associated data:`, associatedData);
    console.log(`Encrypted (MCR):`, encrypted);

    try {
      const decrypted = cipher.decrypt(encrypted, { key, associatedData });
      console.log(`Decrypted:`, decrypted.toString('utf8'));
    } catch (err) {
      console.log(`Decryption failed:`, err.message);
    }

    // Try tampering with the encrypted string (change last character)
    const tampered = encrypted.slice(0, -1) + 'x';
    try {
      cipher.decrypt(tampered, { key, associatedData });
      console.log(`Tampered decryption succeeded (should not happen)!`);
    } catch (err) {
      console.log(`Tampered decryption failed as expected:`, err.message);
    }
  } catch (err) {
    console.log(`Encryption error:`, err);
  }
})();

// 5. Key Derivation
console.log('\n=== Key Derivation ===');
const masterKey = kdf.generateKey(32);
const salt = random.bytes(16); // Salt for HKDF
const derivedKey = kdf.deriveSecret(masterKey, { salt, info: 'key derivation example', keyLength: 32 });
console.log(`Master key:`, masterKey.toString('hex'));
console.log(`Salt:`, salt.toString('hex'));
console.log(`Derived key (HKDF):`, derivedKey.toString('hex'));

// 6. Digital Signatures
console.log('\n=== Digital Signatures ===');
const keyPair = keys.generateKeyPair();
const message = 'Important document';
(async () => {
  const signature = await keys.signData(message, { privateKey: keyPair.privateKey });
  console.log(`Message:`, message);
  console.log(`Signature:`, signature);

  const verified = await keys.verifySignature(message, signature, { publicKey: keyPair.publicKey });
  console.log(`Signature verified:`, verified);

  // Try with wrong message
  const wrongVerified = await keys.verifySignature('Wrong message', signature, { publicKey: keyPair.publicKey });
  console.log(`Wrong message verified:`, wrongVerified);
})();

// Export and import keys example
console.log('\n=== Key Export/Import ===');
const exportedPub = keys.exportKey(keys.importPublicKey(keyPair.publicKey), 'public');
const exportedPriv = keys.exportKey(keys.importPrivateKey(keyPair.privateKey), 'private');
console.log('Exported public key matches original:', exportedPub === keyPair.publicKey);
console.log('Exported private key matches original:', exportedPriv === keyPair.privateKey);

// Use imported keys to sign and verify
const importedPub = keys.importPublicKey(exportedPub);
const importedPriv = keys.importPrivateKey(exportedPriv);
const signature2 = await keys.signData(message, { privateKey: importedPriv });
const verified2 = await keys.verifySignature(message, signature2, { publicKey: importedPub });
console.log('Signed/verified with imported keys:', verified2);

console.log('\n=== Example completed ===');
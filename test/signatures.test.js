import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { keys, random } from '../src/index.js';

describe('MCR Keys and Signatures (Ed25519)', () => {
  it('should generate a key pair', () => {
    const keyPair = keys.generateKeyPair();
    assert.strictEqual(typeof keyPair.publicKey, 'string');
    assert.strictEqual(typeof keyPair.privateKey, 'string');
    // Check that they look like PEM
    assert.ok(keyPair.publicKey.startsWith('-----BEGIN PUBLIC KEY-----'));
    assert.ok(keyPair.privateKey.startsWith('-----BEGIN PRIVATE KEY-----'));
  });

  it('should sign and verify correctly', () => {
    const keyPair = keys.generateKeyPair();
    const data = 'data to sign';
    const signature = keys.signData(data, { privateKey: keyPair.privateKey });
    assert.strictEqual(typeof signature, 'string');
    assert.ok(signature.startsWith('MCR$'));

    const verified = keys.verifySignature(data, signature, { publicKey: keyPair.publicKey });
    assert.strictEqual(verified, true);
  });

  it('should not verify with wrong data', () => {
    const keyPair = keys.generateKeyPair();
    const data = 'data to sign';
    const wrongData = 'wrong data';
    const signature = keys.signData(data, { privateKey: keyPair.privateKey });
    const verified = keys.verifySignature(wrongData, signature, { publicKey: keyPair.publicKey });
    assert.strictEqual(verified, false);
  });

  it('should not verify with wrong signature', () => {
    const keyPair1 = keys.generateKeyPair();
    const keyPair2 = keys.generateKeyPair(); // different key pair
    const data = 'data to sign';
    const signature = keys.signData(data, { privateKey: keyPair1.privateKey });
    const verified = keys.verifySignature(data, signature, { publicKey: keyPair2.publicKey });
    assert.strictEqual(verified, false);
  });

  it('should detect tampering with signature', () => {
    const keyPair = keys.generateKeyPair();
    const data = 'tamper me';
    const signature = keys.signData(data, { privateKey: keyPair.privateKey });
    // Tamper with the signature string (last character)
    const tampered = signature.slice(0, -1) + 'x';
    const verified = keys.verifySignature(data, tampered, { publicKey: keyPair.publicKey });
    assert.strictEqual(verified, false);
  });

  it('should export and import keys correctly', () => {
    const original = keys.generateKeyPair();
    // Export the keys
    const exportedPub = keys.exportKey(keys.importPublicKey(original.publicKey), 'public');
    const exportedPriv = keys.exportKey(keys.importPrivateKey(original.privateKey), 'private');
    // They should match the original PEM strings (maybe whitespace differences?)
    // We'll just check that they are valid PEM and can be used
    const importedPub = keys.importPublicKey(exportedPub);
    const importedPriv = keys.importPrivateKey(exportedPriv);
    const data = 'test export/import';
    const signature = keys.signData(data, { privateKey: importedPriv });
    const verified = keys.verifySignature(data, signature, { publicKey: importedPub });
    assert.strictEqual(verified, true);
  });

  it('should handle invalid signature format', () => {
    const keyPair = keys.generateKeyPair();
    const data = 'test';
    const verified = keys.verifySignature(data, 'invalid-format', { publicKey: keyPair.publicKey });
    assert.strictEqual(verified, false);
  });
});
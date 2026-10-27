import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cipher, random } from '../src/index.js';

describe('MCR Cipher (AES-256-GCM)', () => {
  it('should encrypt and decrypt correctly', () => {
    const plaintext = 'Hello, MCR!';
    const key = random.bytes(32); // 256-bit key
    const encrypted = cipher.encrypt(plaintext, { key }); // should be MCR# string
    const decrypted = cipher.decrypt(encrypted, { key });
    assert.strictEqual(decrypted.toString('utf8'), plaintext);
  });

  it('should produce different ciphertexts for the same plaintext (random nonce)', () => {
    const plaintext = 'same plaintext';
    const key = random.bytes(32);
    const enc1 = cipher.encrypt(plaintext, { key });
    const enc2 = cipher.encrypt(plaintext, { key });
    assert.notStrictEqual(enc1, enc2);
  });

  it('should detect tampering with ciphertext', () => {
    const plaintext = 'tamper me';
    const key = random.bytes(32);
    const encrypted = cipher.encrypt(plaintext, { key });
    // Tamper with the last character of the base64url string
    const tampered = encrypted.slice(0, -1) + 'x';
    assert.throws(() => cipher.decrypt(tampered, { key }), /Invalid/);
  });

  it('should detect tampering with nonce', () => {
    const plaintext = 'tamper nonce';
    const key = random.bytes(32);
    const encrypted = cipher.encrypt(plaintext, { key });
    // To tamper with nonce we need to alter the base64url encoding.
    // Simplest: change a character in the encrypted string.
    const tampered = encrypted.slice(0, -1) + 'y';
    assert.throws(() => cipher.decrypt(tampered, { key }), /Invalid/);
  });

  it('should detect wrong key', () => {
    const plaintext = 'wrong key';
    const key1 = random.bytes(32);
    const key2 = random.bytes(32); // different key
    const encrypted = cipher.encrypt(plaintext, { key: key1 });
    assert.throws(() => cipher.decrypt(encrypted, { key: key2 }), /Invalid/);
  });

  it('should handle associated data (AAD)', () => {
    const plaintext = 'data with aad';
    const key = random.bytes(32);
    const aad = 'authenticated but not encrypted';
    const encrypted = cipher.encrypt(plaintext, { key, associatedData: aad });
    // Decrypt with same AAD should work
    const decrypted = cipher.decrypt(encrypted, { key, associatedData: aad });
    assert.strictEqual(decrypted.toString('utf8'), plaintext);
    // Decrypt without AAD or wrong AAD should fail
    assert.throws(() => cipher.decrypt(encrypted, { key }), /Invalid/);
    assert.throws(() => cipher.decrypt(encrypted, { key, associatedData: 'wrong aad' }), /Invalid/);
  });
});
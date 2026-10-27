import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { kdf, random } from '../src/index.js';

describe('MCR KDF', () => {
  it('should generate a random key of specified length', () => {
    const length = 32;
    const key = kdf.generateKey(length);
    assert.strictEqual(key.length, length);
    assert.ok(key instanceof Buffer);
  });

  it('should derive the same secret with same parameters', () => {
    const secret = random.bytes(32);
    const keyLength = 32;
    const salt = random.bytes(16);
    const info = Buffer.from('test info');
    const key1 = kdf.deriveSecret(secret, { keyLength, salt, info });
    const key2 = kdf.deriveSecret(secret, { keyLength, salt, info });
    // Buffers should be equal
    assert.deepStrictEqual(key1, key2);
  });

  it('should derive different secrets with different salts', () => {
    const secret = random.bytes(32);
    const keyLength = 32;
    const salt1 = random.bytes(16);
    const salt2 = random.bytes(16);
    const info = Buffer.from('test info');
    const key1 = kdf.deriveSecret(secret, { keyLength, salt: salt1, info });
    const key2 = kdf.deriveSecret(secret, { keyLength, salt: salt2, info });
    assert.notDeepStrictEqual(key1, key2);
  });

  it('should derive a key from a password with scrypt', () => {
    const password = 'test-password';
    const salt = random.bytes(16);
    const keyLength = 32;
    const key = kdf.deriveKeyFromPassword(password, { salt, keyLength });
    assert.strictEqual(key.length, keyLength);
    assert.ok(key instanceof Buffer);
  });

  it('should derive different keys from same password with different salts', () => {
    const password = 'same-password';
    const keyLength = 32;
    const salt1 = random.bytes(16);
    const salt2 = random.bytes(16);
    const key1 = kdf.deriveKeyFromPassword(password, { salt: salt1, keyLength });
    const key2 = kdf.deriveKeyFromPassword(password, { salt: salt2, keyLength });
    assert.notDeepStrictEqual(key1, key2);
  });

  it('should throw for invalid parameters in deriveKeyFromPassword', () => {
    assert.throws(() => kdf.deriveKeyFromPassword('test', { salt: random.bytes(16), keyLength: 0 }), /keyLength/);
    assert.throws(() => kdf.deriveKeyFromPassword('test', { salt: random.bytes(16), keyLength: 16, N: 1 }), /N must be/);
  });
});
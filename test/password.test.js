import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hash } from '../src/index.js';

describe('MCR Hash Password', () => {
  it('should hash and verify a correct password', async () => {
    const password = 'my-secret-password';
    const hashed = await hash.password.hash(password);
    // Check that the hash is a string and starts with MCR#
    assert.strictEqual(typeof hashed, 'string');
    assert.ok(hashed.startsWith('MCR#'));

    const verified = await hash.password.verify(password, hashed);
    assert.strictEqual(verified, true);
  });

  it('should not verify an incorrect password', async () => {
    const password = 'my-secret-password';
    const wrongPassword = 'wrong-password';
    const hashed = await hash.password.hash(password);
    const verified = await hash.password.verify(wrongPassword, hashed);
    assert.strictEqual(verified, false);
  });

  it('should produce different hashes for the same password (due to salt)', async () => {
    const password = 'same-password';
    const hash1 = await hash.password.hash(password);
    const hash2 = await hash.password.hash(password);
    assert.notStrictEqual(hash1, hash2);
  });

  it('should reject malformed hash strings', async () => {
    const password = 'test';
    // Not an MCR format
    let verified = await hash.password.verify(password, 'not-an-mcr-hash');
    assert.strictEqual(verified, false);
    // Wrong prefix
    verified = await hash.password.verify(password, 'FOO$1$scrypt$...');
    assert.strictEqual(verified, false);
    // Wrong version (we only support version 1)
    verified = await hash.password.verify(password, 'MCR$2$scrypt$...');
    assert.strictEqual(verified, false);
  });

  it('should handle empty password (though not recommended)', async () => {
    const password = '';
    const hashed = await hash.password.hash(password);
    const verified = await hash.password.verify(password, hashed);
    assert.strictEqual(verified, true);
  });
});
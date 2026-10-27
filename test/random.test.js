import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { random } from '../src/index.js';

describe('MCR Random', () => {
  it('should generate random bytes of specified length', () => {
    const size = 16;
    const buf = random.bytes(size);
    assert.strictEqual(buf.length, size);
    assert.ok(buf instanceof Buffer);
  });

  it('should throw for non-positive size', () => {
    assert.throws(() => random.bytes(0), /must be a positive integer/);
    assert.throws(() => random.bytes(-1), /must be a positive integer/);
    assert.throws(() => random.bytes(3.14), /must be a positive integer/);
  });

  it('should generate a token string of expected length (approx)', () => {
    const size = 16;
    const token = random.token(size);
    // Base64URL encoding without padding: 4 * ceil(size / 3) - (size % 3 === 0 ? 0 : (3 - size % 3))
    // For 16 bytes: 4 * ceil(16/3) = 24, minus 2 padding characters = 22
    assert.strictEqual(token.length, 22);
    // Should only contain valid base64url characters
    assert.match(token, /^[A-Za-z0-9_-]+$/);
  });

  it('should generate different tokens on each call', () => {
    const token1 = random.token(16);
    const token2 = random.token(16);
    assert.notStrictEqual(token1, token2);
  });

  it('should generate tokenHex of expected length', () => {
    const size = 16;
    const tokenHex = random.tokenHex(size);
    assert.strictEqual(tokenHex.length, size * 2); // hex encoding
    assert.match(tokenHex, /^[0-9a-f]+$/);
  });
});
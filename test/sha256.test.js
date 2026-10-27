import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hash } from '../src/index.js';

// Known test vector for SHA-256
// From FIPS 180-4: "abc"
const TEST_VECTORS = [
  {
    input: 'abc',
    hex: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  },
  {
    input: 'abcdbcdecdefdefgefghfghighijhjkijkljklmklmnlmnomnopnopqrs',
    hex: '2f4eaf7bd1898825cc590b8912385c806aba37ea000344d0c52685bc055f5bea'
  },
  {
    input: '',
    hex: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  }
];

describe('MCR Hash SHA-256', () => {
  for (const { input, hex } of TEST_VECTORS) {
    it(`should hash '${input}' correctly (hex)`, () => {
      const result = hash.sha256(input);
      assert.strictEqual(result, hex);
    });

    it(`should hash '${input}' correctly (base64url)`, () => {
      const result = hash.sha256(input, { encoding: 'base64url' });
      // Convert the known hex to base64url for comparison
      const buf = Buffer.from(hex, 'hex');
      const expected = buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      assert.strictEqual(result, expected);
    });
  }

  it('should accept Buffer input', () => {
    const bufInput = Buffer.from('hello');
    const result = hash.sha256(bufInput);
    const expected = hash.sha256('hello'); // same as string
    assert.strictEqual(result, expected);
  });

  it('should throw for invalid encoding', () => {
    assert.throws(() => hash.sha256('test', { encoding: 'invalid' }), /Encoding must be/);
  });
});
import { randomBytes } from 'node:crypto';
import { hkdfSync } from 'node:crypto';
import { scryptSync } from 'node:crypto';
import { validateBuffer, validatePositiveInteger, validateNonEmptyString } from '../core/validation.js';
import { encodeBase64URL } from '../core/encoding.js';

/**
 * Derives a key from a high-entropy secret using HKDF.
 * @param {Buffer} secret - The high-entropy secret.
 * @param {Object} options - The options for HKDF.
 * @param {number} options.keyLength - The length of the derived key in bytes.
 * @param {Buffer|string} [options.salt] - Salt (optional, default: no salt).
 * @param {Buffer|string} [options.info] - Context/application specific info (optional).
 * @param {string} [options.hash='sha256'] - The hash algorithm to use (default: 'sha256').
 * @returns {Buffer} The derived key.
 */
export function deriveSecret(secret, options) {
  validateBuffer(secret, 'secret');
  const {
    keyLength,
    salt = null,
    info = null,
    hash = 'sha256'
  } = options;

  validatePositiveInteger(keyLength, 'keyLength');

  // Convert salt and info to Buffer if they are strings
  const saltBuffer = salt !== null ? (typeof salt === 'string' ? Buffer.from(salt, 'utf8') : salt) : null;
  const infoBuffer = info !== null ? (typeof info === 'string' ? Buffer.from(info, 'utf8') : info) : null;

  return hkdfSync(hash, secret, saltBuffer, infoBuffer, keyLength);
}

/**
 * Generates a random key of the specified length.
 * @param {number} length - The length of the key in bytes.
 * @returns {Buffer} A random key.
 */
export function generateKey(length) {
  validatePositiveInteger(length, 'length');
  return randomBytes(length);
}

/**
 * Derives a key from a password using scrypt (for use in encryption, not for storage).
 * @param {string} password - The password.
 * @param {Object} options - The options for scrypt.
 * @param {Buffer|string} options.salt - The salt (must be provided).
 * @param {number} options.keyLength - The length of the derived key in bytes.
 * @param {number} [options.N=16384] - CPU/memory cost parameter.
 * @param {number} [options.r=8] - Block size parameter.
 * @param {number} [options.p=1] - Parallelization parameter.
 * @param {number} [options.maxmem=32*1024*1024] - Memory limit in bytes.
 * @returns {Buffer} The derived key.
 */
export function deriveKeyFromPassword(password, options) {
  validateNonEmptyString(password, 'password');
  const {
    salt,
    keyLength,
    N = 16384,
    r = 8,
    p = 1,
    maxmem = 32 * 1024 * 1024
  } = options;

  validateBuffer(salt, 'salt');
  validatePositiveInteger(keyLength, 'keyLength');

  // Validate scrypt parameters
  if (!(N & (N - 1)) === 0 || N < 2) {
    throw new Error('N must be a power of two greater than 1');
  }
  if (r <= 0 || p <= 0) {
    throw new Error('r and p must be positive integers');
  }
  if (maxmem <= 0) {
    throw new Error('maxmem must be positive');
  }

  // Convert salt to Buffer if it's a string
  const saltBuffer = typeof salt === 'string' ? Buffer.from(salt, 'utf8') : salt;

  return scryptSync(password, saltBuffer, keyLength, { N, r, p, maxmem });
}
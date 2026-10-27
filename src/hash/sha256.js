import { createHash } from 'node:crypto';
import { validateNonEmptyString } from '../core/validation.js';
import { encodeHex, encodeBase64URL } from '../core/encoding.js';

/**
 * Computes the SHA-256 hash of the given data.
 * @param {string|Buffer|TypedArray|DataView} data - The data to hash.
 * @param {{ encoding?: 'hex' | 'base64url' }} [options] - The output encoding.
 * @returns {string} The hash as a string in the specified encoding (default: hex).
 */
export function sha256(data, options = {}) {
  const { encoding = 'hex' } = options;
  if (encoding !== 'hex' && encoding !== 'base64url') {
    throw new Error('Encoding must be either "hex" or "base64url"');
  }

  const hash = createHash('sha256');
  hash.update(data);
  const hashBuffer = hash.digest();

  if (encoding === 'hex') {
    return encodeHex(hashBuffer);
  } else { // base64url
    return encodeBase64URL(hashBuffer);
  }
}

/**
 * Computes the SHA-256 hash of the given string (UTF-8 encoded).
 * @param {string} data - The string to hash.
 * @param {{ encoding?: 'hex' | 'base64url' }} [options] - The output encoding.
 * @returns {string} The hash as a string in the specified encoding (default: hex).
 */
export function sha256String(data, options = {}) {
  validateNonEmptyString(data, 'data');
  return sha256(data, options);
}
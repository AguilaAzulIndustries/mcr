import { randomBytes } from 'node:crypto';
import { validatePositiveInteger } from './validation.js';
import { encodeBase64URL, encodeHex } from './encoding.js';

/**
 * Generates cryptographically secure random bytes.
 * @param {number} size - The number of bytes to generate.
 * @returns {Buffer} A buffer containing the random bytes.
 */
export function bytes(size) {
  validatePositiveInteger(size, 'size');
  return randomBytes(size);
}

/**
 * Generates a cryptographically secure random token and encodes it as base64url.
 * @param {number} size - The number of random bytes to generate (before encoding).
 * @returns {string} A base64url encoded token.
 */
export function token(size) {
  validatePositiveInteger(size, 'size');
  const buffer = bytes(size);
  return encodeBase64URL(buffer);
}

/**
 * Generates a cryptographically secure random token and encodes it as hex.
 * @param {number} size - The number of random bytes to generate (before encoding).
 * @returns {string} A hex encoded token.
 */
export function tokenHex(size) {
  validatePositiveInteger(size, 'size');
  const buffer = bytes(size);
  return encodeHex(buffer);
}
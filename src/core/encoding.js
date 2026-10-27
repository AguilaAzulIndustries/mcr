// Encoding utilities for MCR

/**
 * Encodes a Buffer to a base64url string (without padding).
 * @param {Buffer} buffer - The buffer to encode.
 * @returns {string} The base64url encoded string.
 */
export function encodeBase64URL(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/**
 * Decodes a base64url string to a Buffer.
 * @param {string} str - The base64url string to decode.
 * @returns {Buffer} The decoded buffer.
 */
export function decodeBase64URL(str) {
  // Add padding if necessary
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (padded.length % 4)) % 4);
  return Buffer.from(padded + padding, 'base64');
}

/**
 * Encodes a Buffer to a hex string.
 * @param {Buffer} buffer - The buffer to encode.
 * @returns {string} The hex encoded string.
 */
export function encodeHex(buffer) {
  return buffer.toString('hex');
}

/**
 * Decodes a hex string to a Buffer.
 * @param {string} str - The hex string to decode.
 * @returns {Buffer} The decoded buffer.
 */
export function decodeHex(str) {
  return Buffer.from(str, 'hex');
}

/**
 * Encodes a Buffer to a UTF-8 string.
 * @param {Buffer} buffer - The buffer to encode.
 * @returns {string} The UTF-8 encoded string.
 */
export function encodeUTF8(buffer) {
  return buffer.toString('utf8');
}

/**
 * Decodes a UTF-8 string to a Buffer.
 * @param {string} str - The UTF-8 string to decode.
 * @returns {Buffer} The decoded buffer.
 */
export function decodeUTF8(str) {
  return Buffer.from(str, 'utf8');
}
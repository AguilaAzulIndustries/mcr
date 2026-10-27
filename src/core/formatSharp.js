import { encodeBase64URL } from './encoding.js';

/**
 * Encode data into MCR# sharp format.
 * @param {number} type - One byte type identifier.
 * @param {Buffer} payload - The payload data.
 * @returns {string} String starting with MCR# followed by base64url encoded version|type|payload.
 */
export function encodeSharp(type, payload) {
  if (!Buffer.isBuffer(payload)) {
    throw new TypeError('Payload must be a Buffer');
  }
  if (typeof type !== 'number' || type < 0 || type > 255) {
    throw new TypeError('Type must be a byte (0-255)');
  }
  const version = 1; // current version
  const versionBuf = Buffer.from([version]);
  const typeBuf = Buffer.from([type]);
  const data = Buffer.concat([versionBuf, typeBuf, payload]);
  return `MCR#${encodeBase64URL(data)}`;
}

/**
 * Decode an MCR# sharp format string.
 * @param {string} mcrString - String starting with MCR#.
 * @returns {Object} { version, type, payload } where payload is a Buffer.
 */
export function decodeSharp(mcrString) {
  if (typeof mcrString !== 'string' || !mcrString.startsWith('MCR#')) {
    throw new Error('Invalid MCR# format: missing prefix');
  }
  const encoded = mcrString.slice(4); // remove 'MCR#'
  // Add padding for base64url
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (padded.length % 4)) % 4);
  const buffer = Buffer.from(padded + padding, 'base64');
  if (buffer.length < 2) {
    throw new Error('Invalid MCR# payload: too short');
  }
  const version = buffer.readUInt8(0);
  const type = buffer.readUInt8(1);
  const payload = buffer.slice(2);
  return { version, type, payload };
}


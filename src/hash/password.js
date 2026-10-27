import { randomBytes } from 'node:crypto';
import { scrypt } from 'node:crypto';
import { timingSafeEqual } from 'node:crypto';
import { MCRValidationError } from '../core/errors.js';
import { encodeBase64URL, decodeBase64URL } from '../core/encoding.js';
import { format as formatMCR, parse as parseMCR } from '../core/format.js';
import { encodeSharp, decodeSharp } from '../core/formatSharp.js';

// Default parameters for scrypt
const DEFAULT_N = 16384;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const DEFAULT_KEYLEN = 64; // 512 bits

// Type identifier for password hash in MCR# sharp format
const TYPE_PASSWORD_HASH = 0x04;

/**
 * Validates scrypt parameters.
 * @param {Object} params - The scrypt parameters.
 * @throws {MCRValidationError} If any parameter is invalid.
 */
function validateScryptParams({ N, r, p, maxmem }) {
  // N must be a power of two and greater than 1
  if (((N & (N - 1)) !== 0) || N < 2) {
    throw new MCRValidationError('N must be a power of two greater than 1');
  }
  // N should not be excessively large to avoid DoS
  if (N > Math.pow(2, 30)) {
    throw new MCRValidationError('N is too large');
  }
  // r and p must be positive integers within reasonable bounds
  if (r <= 0 || r > Math.pow(2, 15)) {
    throw new MCRValidationError('r must be a positive integer not exceeding 2^15');
  }
  if (p <= 0 || p > Math.pow(2, 15)) {
    throw new MCRValidationError('p must be a positive integer not exceeding 2^15');
  }
  // Optional: check maxmem if provided
  if (maxmem !== undefined && maxmem <= 0) {
    throw new MCRValidationError('maxmem must be positive');
  }
}

/**
 * Generates a random salt.
 * @param {number} size - The size of the salt in bytes.
 * @returns {Promise<Buffer>} A promise that resolves with the salt.
 */
function generateSalt(size = 16) {
  return randomBytes(size);
}

/**
 * Hashes a password using scrypt and returns an MCR# formatted string.
 * @param {string} password - The password to hash.
 * @param {Object} [options] - The options for scrypt.
 * @param {number} [options.N=16384] - CPU/memory cost parameter.
 * @param {number} [options.r=8] - Block size parameter.
 * @param {number} [options.p=1] - Parallelization parameter.
 * @param {number} [options.maxmem=32*1024*1024] - Memory limit in bytes.
 * @param {number} [options.keylen=64] - Desired key length in bytes.
 * @returns {Promise<string>} A promise that resolves with the MCR# formatted hash string.
 */
export async function hash(password, options = {}) {
  if (typeof password !== 'string') {
    throw new MCRValidationError('password must be a string');
  }
  const {
    N = DEFAULT_N,
    r = DEFAULT_R,
    p = DEFAULT_P,
    maxmem = 32 * 1024 * 1024, // 32 MB
    keylen = DEFAULT_KEYLEN
  } = options;

  validateScryptParams({ N, r, p, maxmem });
  if (keylen <= 0 || keylen > 255) {
    throw new MCRValidationError('keylen must be positive and not exceed 255');
  }

  const salt = await generateSalt(16);
  // scrypt is asynchronous; we use the callback version wrapped in a promise
  const derivedKey = await new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, { N, r, p, maxmem }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });

  // Build payload: N (4), r (2), p (2), keylen (2), salt (16), derivedKey (keylen)
  const payloadSize = 4 + 2 + 2 + 2 + 16 + keylen;
  const payload = Buffer.alloc(payloadSize);
  let offset = 0;
  payload.writeUInt32BE(N, offset); offset += 4;
  payload.writeUInt16BE(r, offset); offset += 2;
  payload.writeUInt16BE(p, offset); offset += 2;
  payload.writeUInt16BE(keylen, offset); offset += 2;
  salt.copy(payload, offset); offset += 16; // salt is 16 bytes
  derivedKey.copy(payload, offset); // derivedKey bytes

  // Encode using sharp format with our type
  return encodeSharp(TYPE_PASSWORD_HASH, payload);
}

/**
 * Verifies a password against an MCR formatted hash string.
 * Supports both new MCR# format and legacy MCR$ format for backward compatibility.
 * @param {string} password - The password to verify.
 * @param {string} hashString - The MCR formatted hash string.
 * @returns {Promise<boolean>} A promise that resolves with true if the password matches, false otherwise.
 */
export async function verify(password, hashString) {
  if (typeof password !== 'string' || typeof hashString !== 'string') {
    return false;
  }

  // Try to parse as new MCR# sharp format first
  if (hashString.startsWith('MCR#')) {
    let decoded;
    try {
      decoded = decodeSharp(hashString);
    } catch (err) {
      // Invalid MCR# format
      return false;
    }
    const { version, type, payload } = decoded;

    // Check version and type
    if (version !== 1 || type !== TYPE_PASSWORD_HASH) {
      return false;
    }

    // Parse payload: N (4), r (2), p (2), keylen (2), salt (16), derivedKey (rest)
    if (payload.length < 4 + 2 + 2 + 2 + 16) {
      return false; // too short for fixed fields
    }
    let offset = 0;
    const N = payload.readUInt32BE(offset); offset += 4;
    const r = payload.readUInt16BE(offset); offset += 2;
    const p = payload.readUInt16BE(offset); offset += 2;
    const keylen = payload.readUInt16BE(offset); offset += 2;
    // Validate parameters again (could be omitted if trust encoding, but safer)
    try {
      validateScryptParams({ N, r, p, maxmem: 32 * 1024 * 1024 }); // maxmem not stored, use default limit
    } catch (err) {
      return false;
    }
    if (keylen <= 0 || keylen > 255) {
      return false;
    }
    const salt = payload.slice(offset, offset + 16); offset += 16;
    const expectedKeyLen = keylen;
    const derivedKeyBuffer = payload.slice(offset, offset + expectedKeyLen);
    if (derivedKeyBuffer.length !== expectedKeyLen) {
      return false; // trailing extra bytes? treat as malformed
    }
    // Ensure no extra bytes beyond derivedKey
    if (offset + expectedKeyLen !== payload.length) {
      return false;
    }

    // Compute derived key for password
    let derivedKey;
    try {
      derivedKey = await new Promise((resolve, reject) => {
        scrypt(password, salt, expectedKeyLen, { N, r, p }, (err, key) => {
          if (err) reject(err);
          else resolve(key);
        });
      });
    } catch (err) {
      return false;
    }

    return timingSafeEqual(derivedKey, derivedKeyBuffer);
  }

  // Fallback to legacy MCR$ format parsing
  let parsed;
  try {
    parsed = parseMCR(hashString);
  } catch (err) {
    // If the hash string is not a valid MCR format, return false (to avoid timing leaks)
    return false;
  }

  // Check algorithm
  if (parsed.algorithm !== 'scrypt') {
    return false;
  }

  // Extract parameters from the first part
  const paramsString = parsed.parts[0]; // "N=...,r=...,p=..."
  const params = {};
  for (const pair of paramsString.split(',')) {
    const [key, value] = pair.split('=');
    params[key] = parseInt(value, 10);
  }
  const { N, r, p } = params;
  if (typeof N !== 'number' || typeof r !== 'number' || typeof p !== 'number') {
    return false;
  }

  // Check we have exactly three parts: parameters, salt, and hash
  if (parsed.parts.length !== 3) {
    return false;
  }

  let saltBuffer, hashBuffer;
  try {
    saltBuffer = decodeBase64URL(parsed.parts[1]);
    hashBuffer = decodeBase64URL(parsed.parts[2]);
  } catch (err) {
    // If decoding fails, return false
    return false;
  }

  // Validate parameters (reuse validation)
  try {
    validateScryptParams({ N, r, p, maxmem: 32 * 1024 * 1024 });
  } catch (err) {
    return false;
  }
  const keylen = hashBuffer.length; // implied from hashBuffer length
  if (keylen <= 0) {
    return false;
  }

  // Compute the derived key for the password
  let derivedKey;
  try {
    derivedKey = await new Promise((resolve, reject) => {
      scrypt(password, saltBuffer, keylen, { N, r, p }, (err, key) => {
        if (err) reject(err);
        else resolve(key);
      });
    });
  } catch (err) {
    return false;
  }

  // Compare using timingSafeEqual
  return timingSafeEqual(derivedKey, hashBuffer);
}
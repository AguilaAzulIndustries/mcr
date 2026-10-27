import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { validateBuffer, validatePositiveInteger } from '../core/validation.js';
import { encodeBase64URL, decodeBase64URL } from '../core/encoding.js';
import { format as formatMCR, parse as parseMCR } from '../core/format.js';
import { timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 32; // AES-256
const NONCE_LENGTH = 12; // GCM recommended nonce length
const TAG_LENGTH = 16; // GCM tag length

/**
 * Encrypts plaintext using AES-256-GCM.
 * @param {string|Buffer|TypedArray|DataView} plaintext - The data to encrypt.
 * @param {Object} options - The encryption options.
 * @param {Buffer} options.key - The encryption key (must be 32 bytes).
 * @param {Buffer|string} [options.associatedData] - Additional data to authenticate (not encrypted).
 * @returns {string} The MCR formatted encrypted string.
 */
export function encrypt(plaintext, options) {
  let { key, associatedData = null } = options;
  validateBuffer(key, 'key');
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Key must be ${KEY_LENGTH} bytes long`);
  }

  // Generate a random nonce
  const nonce = randomBytes(NONCE_LENGTH);

  // Create cipher
  const cipher = createCipheriv('aes-256-gcm', key, nonce);

  // Associate data if provided
  if (associatedData !== null) {
    if (typeof associatedData === 'string') {
      associatedData = Buffer.from(associatedData, 'utf8');
    }
    cipher.setAAD(associatedData);
  }

  // Encrypt
  let ciphertext = cipher.update(plaintext);
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);

  // Get the tag
  const tag = cipher.getAuthTag();

  // Format: MCR$1$aes-256-gcm$nonce$tag$ciphertext
  const nonceEncoded = encodeBase64URL(nonce);
  const tagEncoded = encodeBase64URL(tag);
  const ciphertextEncoded = encodeBase64URL(ciphertext);
  return formatMCR('aes-256-gcm', nonceEncoded, tagEncoded, ciphertextEncoded);
}

/**
 * Decrypts an MCR formatted encrypted string using AES-256-GCM.
 * @param {string} encryptedString - The MCR formatted encrypted string.
 * @param {Object} options - The decryption options.
 * @param {Buffer} options.key - The decryption key (must be 32 bytes).
 * @returns {Buffer} The decrypted plaintext.
 * @throws {Error} If authentication fails or the format is invalid.
 */
export function decrypt(encryptedString, options) {
  let { key, associatedData = null } = options;
  validateBuffer(key, 'key');
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Key must be ${KEY_LENGTH} bytes long`);
  }

  let parsed;
  try {
    parsed = parseMCR(encryptedString);
  } catch (err) {
    throw new Error('Invalid MCR format');
  }

  if (parsed.algorithm !== 'aes-256-gcm') {
    throw new Error('Unsupported algorithm');
  }

  if (parsed.parts.length !== 3) {
    throw new Error('Invalid MCR format: expected 3 parts (nonce, tag, ciphertext)');
  }

  let nonceBuffer, tagBuffer, ciphertextBuffer;
  try {
    nonceBuffer = decodeBase64URL(parsed.parts[0]);
    tagBuffer = decodeBase64URL(parsed.parts[1]);
    ciphertextBuffer = decodeBase64URL(parsed.parts[2]);
  } catch (err) {
    throw new Error('Failed to decode base64url parts');
  }

  // Validate lengths
  if (nonceBuffer.length !== NONCE_LENGTH) {
    throw new Error(`Invalid nonce length: expected ${NONCE_LENGTH} bytes`);
  }
  if (tagBuffer.length !== TAG_LENGTH) {
    throw new Error(`Invalid tag length: expected ${TAG_LENGTH} bytes`);
  }

  // Create decipher
  const decipher = createDecipheriv('aes-256-gcm', key, nonceBuffer);
  // Set the auth tag
  decipher.setAuthTag(tagBuffer);
  // Set associated data if provided
  if (associatedData !== null) {
    if (typeof associatedData === 'string') {
      associatedData = Buffer.from(associatedData, 'utf8');
    }
    decipher.setAAD(associatedData);
  }

  // Decrypt
  try {
    let plaintext = decipher.update(ciphertextBuffer);
    plaintext = Buffer.concat([plaintext, decipher.final()]);
    return plaintext;
  } catch (err) {
    throw new Error('Invalid authentication');
  }
}
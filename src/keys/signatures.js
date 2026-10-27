import { createHash, generateKeyPairSync, sign, verify, createPublicKey, createPrivateKey } from 'node:crypto';
import { validateBuffer, validateNonEmptyString, validatePositiveInteger } from '../core/validation.js';
import { encodeBase64URL, decodeBase64URL } from '../core/encoding.js';
import { format as formatMCR, parse as parseMCR } from '../core/format.js';

/**
 * Generates a new Ed25519 key pair.
 * @returns {Object} An object containing the public and private keys in PEM format.
 * @property {string} publicKey - The public key in PEM format.
 * @property {string} privateKey - The private key in PEM format.
 */
export function generateKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
}

/**
 * Signs data using an Ed25519 private key.
 * @param {string|Buffer|TypedArray|DataView} data - The data to sign.
 * @param {Object} options - The signing options.
 * @param {string|Buffer|KeyObject} options.privateKey - The private key in PEM format, Buffer, or KeyObject.
 * @returns {string} The MCR formatted signature.
 */
export function signData(data, options) {
  const { privateKey } = options;
  // Convert data to Buffer if it's a string
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

  // Convert privateKey to KeyObject if needed
  let privateKeyObj;
  if (typeof privateKey === 'string') {
    privateKeyObj = createPrivateKey(privateKey);
  } else if (privateKey instanceof Buffer) {
    // Try to create a KeyObject from the buffer - assume it's PEM format
    try {
      privateKeyObj = createPrivateKey(privateKey.toString());
    } catch (err) {
      // If that fails, try to create a raw key object (though we don't expect raw keys in our API)
      privateKeyObj = createPrivateKey(privateKey);
    }
  } else {
    // Assume it's already a KeyObject
    privateKeyObj = privateKey;
  }

  // Sign the data using Ed25519 (algorithm: null)
  const signatureBuf = sign(null, dataBuffer, privateKeyObj);
  // Format: MCR$1$ed25519$signature
  const signatureEncoded = encodeBase64URL(signatureBuf);
  return formatMCR('ed25519', signatureEncoded);
}

/**
 * Verifies a signature using an Ed25519 public key.
 * @param {string|Buffer|TypedArray|DataView} data - The data that was signed.
 * @param {string} signatureString - The MCR formatted signature string.
 * @param {Object} options - The verification options.
 * @param {string|Buffer|KeyObject} options.publicKey - The public key in PEM format, Buffer, or KeyObject.
 * @returns {boolean} True if the signature is valid, false otherwise.
 */
export function verifySignature(data, signatureString, options) {
  const { publicKey } = options;
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

  let parsed;
  try {
    parsed = parseMCR(signatureString);
  } catch (err) {
    return false;
  }

  if (parsed.algorithm !== 'ed25519') {
    return false;
  }

  if (parsed.parts.length !== 1) {
    return false;
  }

  let signatureBuf;
  try {
    signatureBuf = decodeBase64URL(parsed.parts[0]);
  } catch (err) {
    return false;
  }

  // Convert publicKey to KeyObject if needed
  let publicKeyObj;
  if (typeof publicKey === 'string') {
    publicKeyObj = createPublicKey(publicKey);
  } else if (publicKey instanceof Buffer) {
    // Try to create a KeyObject from the buffer - assume it's PEM format
    try {
      publicKeyObj = createPublicKey(publicKey.toString());
    } catch (err) {
      // If that fails, try to create a raw key object
      publicKeyObj = createPublicKey(publicKey);
    }
  } else {
    // Assume it's already a KeyObject
    publicKeyObj = publicKey;
  }

  // Verify the signature using Ed25519 (algorithm: null)
  const result = verify(null, dataBuffer, publicKeyObj, signatureBuf);
  return result;
}

/**
 * Exports a KeyObject to PEM format.
 * @param {KeyObject} keyObject - The key object to export.
 * @param {string} type - Either 'public' or 'private'.
 * @returns {string} The key in PEM format.
 */
export function exportKey(keyObject, type) {
  if (type === 'public') {
    return keyObject.export({ type: 'spki', format: 'pem' });
  } else if (type === 'private') {
    return keyObject.export({ type: 'pkcs8', format: 'pem' });
  } else {
    throw new Error('Type must be either "public" or "private"');
  }
}

/**
 * Imports a public key from PEM format.
 * @param {string} pem - The public key in PEM format.
 * @returns {KeyObject} The public key as a KeyObject.
 */
export function importPublicKey(pem) {
  return createPublicKey(pem);
}

/**
 * Imports a private key from PEM format.
 * @param {string} pem - The private key in PEM format.
 * @returns {KeyObject} The private key as a KeyObject.
 */
export function importPrivateKey(pem) {
  return createPrivateKey(pem);
}
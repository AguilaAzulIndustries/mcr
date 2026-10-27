import * as randomCore from './core/random.js';
import * as sha256Hash from './hash/sha256.js';
import * as passwordHash from './hash/password.js';
import * as cipherCore from './cipher/aes-gcm.js';
import * as kdfCore from './kdf/index.js';
import * as keysCore from './keys/index.js';
import { encodeSharp, decodeSharp } from './core/formatSharp.js';
import { encode as wordsEncodeRaw, decode as wordsDecodeRaw, encodeMCR, decodeMCR, defaultDictionary } from './words/index.js';
import * as crypto from 'node:crypto';
import argon2 from 'argon2';
import { format as formatMCR, parse as parseMCR } from './core/format.js';
import { encodeBase64URL, decodeBase64URL } from './core/encoding.js';

// Public API (named exports) - keep existing for compatibility
export const random = {
  bytes: randomCore.bytes,
  token: randomCore.token,
  tokenHex: randomCore.tokenHex
};

export const hash = {
  sha256: sha256Hash.sha256,
  sha256String: sha256Hash.sha256String,
  password: {
    hash: passwordHash.hash,
    verify: passwordHash.verify
  }
};

export const cipher = {
  encrypt: cipherCore.encrypt,
  decrypt: cipherCore.decrypt
};

export const kdf = {
  deriveSecret: kdfCore.deriveSecret,
  generateKey: kdfCore.generateKey,
  deriveKeyFromPassword: kdfCore.deriveKeyFromPassword
};

export const keys = {
  generateKeyPair: keysCore.generateKeyPair,
  signData: keysCore.signData,
  verifySignature: keysCore.verifySignature,
  exportKey: keysCore.exportKey,
  importPublicKey: keysCore.importPublicKey,
  importPrivateKey: keysCore.importPrivateKey
};

// MCR API - three modes
const MCR = {
  // Mode A: Crypto - direct access to node:crypto (wrapper)
  crypto: {
    randomBytes: crypto.randomBytes,
    createHash: crypto.createHash,
    createHmac: crypto.createHmac,
    randomFill: crypto.randomFill,
    // add more as needed
  },

  randomBytes: randomCore.bytes,
  random: {
    bytes: randomCore.bytes,
    token: randomCore.token,
    tokenHex: randomCore.tokenHex
  },

  // Mode B: Argon2 - using argon2 library
  argon2: {
    /**
     * Hash a password using Argon2id.
     * @param {string} password - The password to hash.
     * @param {Object} [options] - Options passed to argon2.hash.
     * @returns {Promise<string>} Promise resolving to the hash string.
     */
    async hash(password, options) {
      return await argon2.hash(password, { type: argon2.argon2id, ...options });
    },
    /**
     * Verify a password against an Argon2 hash.
     * @param {string} hash - The hash string.
     * @param {string} password - The password to verify.
     * @returns {Promise<boolean>} Promise resolving to true if password matches.
     */
    async verify(hash, password) {
      return await argon2.verify(hash, password);
    }
  },

  // Mode C: MCR own mechanisms
  hash: {
    password: {
      // Reuse existing scrypt-based password hash (same as named export hash.password)
      hash: passwordHash.hash,
      verify: passwordHash.verify
    }
  },

  cipher: {
    /**
     * Encrypt plaintext using AES-256-GCM.
     * @param {string|Buffer|TypedArray|DataView} plaintext - Data to encrypt.
     * @param {Object} options - Encryption options.
     * @param {Buffer} options.key - 32-byte key.
     * @param {Buffer|string} [options.associatedData] - Additional authenticated data.
     * @returns {string} MCR# formatted encrypted string.
     */
    encrypt(plaintext, options) {
      const encStr = cipherCore.encrypt(plaintext, options);
      const { algorithm, parts } = parseMCR(encStr);
      if (algorithm !== 'aes-256-gcm') {
        throw new Error('Unexpected algorithm');
      }
      const [nonceB64, tagB64, ciphertextB64] = parts;
      const nonce = decodeBase64URL(nonceB64);
      const tag = decodeBase64URL(tagB64);
      const ciphertext = decodeBase64URL(ciphertextB64);
      const payload = Buffer.concat([nonce, tag, ciphertext]);
      return encodeSharp(0x05, payload);
    },
    /**
     * Decrypt an MCR# formatted AES-256-GCM ciphertext.
     * @param {string} mcrString - MCR# formatted string.
     * @param {Object} options - Decryption options.
     * @param {Buffer} options.key - 32-byte key.
     * @param {Buffer|string} [options.associatedData] - Additional authenticated data.
     * @returns {Buffer} Decrypted plaintext.
     */
    decrypt(mcrString, options) {
      const { version, type, payload } = decodeSharp(mcrString);
      if (version !== 1 || type !== 0x05) {
        throw new Error('Unsupported MCR# format for AES-256-GCM decryption');
      }
      if (payload.length < 12 + 16) {
        throw new Error('Invalid payload length');
      }
      const nonce = payload.slice(0, 12);
      const tag = payload.slice(12, 28);
      const ciphertext = payload.slice(28);
      const nonceB64 = encodeBase64URL(nonce);
      const tagB64 = encodeBase64URL(tag);
      const ciphertextB64 = encodeBase64URL(ciphertext);
      const mcrLegacy = formatMCR('aes-256-gcm', nonceB64, tagB64, ciphertextB64);
      return cipherCore.decrypt(mcrLegacy, options);
    }
  },

  kdf: {
    deriveSecret: kdfCore.deriveSecret,
    generateKey: kdfCore.generateKey,
    deriveKeyFromPassword: kdfCore.deriveKeyFromPassword
  },

  keys: {
    generateKeyPair: keysCore.generateKeyPair,
    signData: keysCore.signData,
    verifySignature: keysCore.verifySignature,
    exportKey: keysCore.exportKey,
    importPublicKey: keysCore.importPublicKey,
    importPrivateKey: keysCore.importPrivateKey
  },

  words: {
    encode: (buffer, options) => wordsEncodeRaw(buffer, { dictionary: options?.dictionary ?? defaultDictionary }),
    decode: (wordsStr, options) => wordsDecodeRaw(wordsStr, { dictionary: options?.dictionary ?? defaultDictionary }),
    encodeMCR: (buffer, options) => encodeMCR(buffer, { dictionary: options?.dictionary ?? defaultDictionary }),
    decodeMCR: (wordsStr, options) => decodeMCR(wordsStr, { dictionary: options?.dictionary ?? defaultDictionary })
  },

  format: {
    encodeSharp,
    decodeSharp
  }
};

// Default export is the MCR API object
export default MCR;


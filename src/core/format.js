// Format constants and helpers for MCR

/**
 * The MCR format prefix.
 * @type {string}
 */
export const PREFIX = 'MCR';

/**
 * The current version of the MCR format.
 * @type {number}
 */
export const VERSION = 1;

/**
 * Creates a formatted string in the MCR format.
 * @param {string} algorithm - The algorithm identifier.
 * @param {Array<string|Buffer>} parts - The parts to include in the format.
 * @returns {string} The formatted string.
 */
export function format(algorithm, ...parts) {
  // Convert any buffers to base64url strings
  const processedParts = parts.map(part => {
    if (part instanceof Buffer) {
      return encodeBase64URL(part);
    }
    return String(part);
  });
  return `${PREFIX}$${VERSION}$${algorithm}$${processedParts.join('$')}`;
}

/**
 * Parses an MCR formatted string.
 * @param {string} formatted - The formatted string to parse.
 * @returns {Object} An object with algorithm and parts (as Buffers where applicable).
 * @throws {MCRFormatError} If the string is not a valid MCR format.
 */
export function parse(formatted) {
  if (!formatted.startsWith(`${PREFIX}$`)) {
    throw new MCRFormatError('Invalid MCR format: missing prefix');
  }
  const [prefix, versionStr, algorithm, ...parts] = formatted.split('$');
  if (prefix !== PREFIX) {
    throw new MCRFormatError('Invalid MCR format: incorrect prefix');
  }
  const version = parseInt(versionStr, 10);
  if (isNaN(version)) {
    throw new MCRFormatError('Invalid MCR format: invalid version');
  }
  // For now, we only support version 1
  if (version !== VERSION) {
    throw new MCRFormatError(`Unsupported MCR format version: ${version}`);
  }
  // Return the algorithm and parts (as strings, the caller can convert to Buffer if needed)
  return { algorithm, parts };
}

// Import encodeBase64URL from encoding to avoid circular dependency
import { encodeBase64URL } from './encoding.js';
import { MCRFormatError } from './errors.js';
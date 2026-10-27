import { MCRValidationError } from './errors.js';

/**
 * Validates that the value is a positive integer.
 * @param {number} value - The value to validate.
 * @param {string} name - The name of the parameter (for error messages).
 * @throws {MCRValidationError} If the value is not a positive integer.
 */
export function validatePositiveInteger(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new MCRValidationError(`${name} must be a positive integer`);
  }
}

/**
 * Validates that the value is a non-negative integer.
 * @param {number} value - The value to validate.
 * @param {string} name - The name of the parameter (for error messages).
 * @throws {MCRValidationError} If the value is not a non-negative integer.
 */
export function validateNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new MCRValidationError(`${name} must be a non-negative integer`);
  }
}

/**
 * Validates that the value is a string and not empty.
 * @param {string} value - The value to validate.
 * @param {string} name - The name of the parameter (for error messages).
 * @throws {MCRValidationError} If the value is not a non-empty string.
 */
export function validateNonEmptyString(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new MCRValidationError(`${name} must be a non-empty string`);
  }
}

/**
 * Validates that the value is a Buffer.
 * @param {any} value - The value to validate.
 * @param {string} name - The name of the parameter (for error messages).
 * @throws {MCRValidationError} If the value is not a Buffer.
 */
export function validateBuffer(value, name) {
  if (!Buffer.isBuffer(value)) {
    throw new MCRValidationError(`${name} must be a Buffer`);
  }
}

/**
 * Validates that the value is a number within a specified range.
 * @param {number} value - The value to validate.
 * @param {string} name - The name of the parameter (for error messages).
 * @param {number} min - The minimum allowed value (inclusive).
 * @param {number} max - The maximum allowed value (inclusive).
 * @throws {MCRValidationError} If the value is not a number or is outside the range.
 */
export function validateNumberInRange(value, name, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new MCRValidationError(`${name} must be a number between ${min} and ${max}`);
  }
}

/**
 * Validates that the value is an object and not null.
 * @param {any} value - The value to validate.
 * @param {string} name - The name of the parameter (for error messages).
 * @throws {MCRValidationError} If the value is not an object or is null.
 */
export function validateObject(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new MCRValidationError(`${name} must be an object`);
  }
}
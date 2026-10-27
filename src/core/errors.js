// Custom error classes for MCR
export class MCRError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    Object.assign(this, options);
  }
}

export class MCRValidationError extends MCRError {
  constructor(message) {
    super(message);
  }
}

export class MCRCryptoError extends MCRError {
  constructor(message) {
    super(message);
  }
}

export class MCRFormatError extends MCRError {
  constructor(message) {
    super(message);
  }
}
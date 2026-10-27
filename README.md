# MCR (Modular Cryptographic Runtime)

A modular cryptographic library for Node.js that provides three distinct operating modes, a word‑based encoding scheme, and a compact binary format (`MCR#`).

## Features

- **Three Modes of Operation**
  - **Crypto**: Direct access to Node.js’ native `crypto` module (via `MCR.crypto`).
  - **Argon2**: Interface to the `argon2` library for Argon2id password hashing.
  - **MCR**: Built‑in cryptographic primitives (random generation, SHA‑256, scrypt password hashing, AES‑256‑GCM encryption, word‑list encoding) with the new `MCR#` format.
- **Word List Encoding**: Deterministic conversion between byte buffers and space‑separated words from a public 2048‑word list.
- **Compact Format**: Outputs of MCR’s own operations are prefixed with `MCR#` and contain a version byte, type byte, and payload.
- **Backward Compatibility**: The original API (`random`, `hash`, `cipher`, `kdf`, `keys`) is preserved and continues to use the legacy `MCR$1$...` format.
- **Side‑features**: Secure random generation, HKDF, scrypt‑based key derivation, Ed25519 signatures (legacy), timing‑safe comparisons, unique nonces, etc.

## Installation

```bash
npm install
```

## Usage

### Accessing the Three Modes

```javascript
import MCR from 'mcr';

// ---------- Mode A: Crypto (native Node.js) ----------
const cryptoBytes = MCR.crypto.randomBytes(16);          // Buffer
const hash = MCR.crypto.createHash('sha256').update('data').digest();

// ---------- Mode B: Argon2 (external library) ----------
const password = 'my secret';
const hashPromise = MCR.argon2.hash(password);
const hash = await hashPromise;                         // Argon2 hash string
const valid = await MCR.argon2.verify(hash, password); // boolean

// ---------- Mode C: MCR own mechanisms ----------
const randomBytes = MCR.randomBytes(8);                 // Buffer (same as MCR.crypto.randomBytes)
const token = MCR.random.token(12);                     // URL‑safe token string

// Password hashing (scrypt‑based, returns MCR# string)
const hashed = await MCR.hash.password.hash('myPassword');
const ok = await MCR.hash.password.verify('myPassword', hashed);

// AES‑256‑GCM encryption (returns MCR# string)
const key = MCR.kdf.generateKey(32);
const { encrypted } = MCR.cipher.encrypt('secret message', { key });
const decrypted = MCR.cipher.decrypt(encrypted, { key });

// Word‑list encoding
const wordString = MCR.words.encode(randomBytes);       // e.g. "w0000 w1234 …"
const recovered = MCR.words.decode(wordString);         // Buffer
```

### Legacy API (unchanged)

The original named exports are still available for backward compatibility:

```javascript
import { random, hash, cipher, kdf, keys } from 'mcr';

// Example: random.bytes(...), hash.sha256(...), cipher.encrypt(...), etc.
```

### Word List

The word list is a deterministic, public list of 2048 words (e.g. `w0000`, `w0001`, …, `w2047`).  
It is used by `MCR.words.encode` and `MCR.words.decode`.  
Because the list is public, security does **not** depend on its secrecy; the entropy comes from the input data.

### Format – `MCR#`

All results produced by the **MCR own mechanisms** (mode C) are prefixed with `MCR#` and follow the specification described in `docs/FORMAT.md`.

Briefly, each result is a Base64URL‑encoded binary buffer consisting of:

| Offset | Size | Meaning               |
|--------|------|-----------------------|
| 0      | 1    | Version (`0x01`)      |
| 1      | 1    | Type identifier       |
| 2…     | n    | Type‑specific payload |

**Type identifiers**

| Hex | Meaning                                    |
|-----|--------------------------------------------|
| 0x01| Random bytes                               |
| 0x02| Token (UTF‑8 string)                       |
| 0x03| Scrypt password hash (UTF‑8 string)        |
| 0x04| Argon2id password hash (UTF‑8 string)      |
| 0x05| AES‑256‑GCM encryption (`nonce‖tag‖ciphertext`) |
| 0x06| Word‑list encoded string (UTF‑8)           |

The legacy `MCR$1$algorithm$...` format is still used by the original exported API for compatibility.

## Security Notes

- All cryptographic primitives rely on the Node.js `crypto` module or the vetted `argon2` library.
- No use of `Math.random()` for cryptographic operations.
- Authenticated encryption (AES‑256‑GCM) guarantees confidentiality and integrity.
- Password hashing uses scrypt (MCR) or Argon2id (external) with configurable parameters; verification employs timing‑safe comparisons.
- Nonces are generated randomly for each encryption operation.
- Key material is never embedded in the output format; only nonces, tags, ciphertext, hashes, or word‑list strings are exposed.
- The word list is public; transforming data to words does not reduce entropy—it is merely a bijective encoding.

## Running Tests

```bash
npm test
```

## License

MIT
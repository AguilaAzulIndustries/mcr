# MCR# Format Specification

The MCR# format is used to represent the output of MCR's own cryptographic operations in a compact, versioned, and reversible way.

## General Structure

```
MCR#<BASE64URL_ENCODED_DATA>
```

Where `<BASE64URL_ENCODED_DATA>` is the Base64URL encoding (RFC 4648, no padding) of a binary buffer composed of:

- **1 byte**: Version (currently `0x01`)
- **1 byte**: Type identifier (see table below)
- **Variable length**: Payload, specific to the type.

## Type Identifiers

| Hex | Name | Description |
|-----|------|-------------|
| `0x01` | Random Bytes | Raw random bytes (output of `MCR.crypto.randomBytes` or `MCR.randomBytes`). |
| `0x02` | Token | URL-safe token string encoded as UTF-8 bytes (output of `MCR.random.token`). |
| `0x03` | Password Hash (Scrypt) | Output of `MCR.hash.password.hash`. Payload is the scrypt-derived key (bytes). |
| `0x04` | Password Hash (Argon2id) | Output of `MCR.argon2.hash`. Payload is the Argon2 hash string encoded as UTF-8 bytes. |
| `0x05` | AES-256-GCM Encryption | Output of `MCR.cipher.encrypt`. Payload: `nonce (12 bytes) || tag (16 bytes) || ciphertext (variable)`. |
| `0x06` | Word List Encoding | Output of `MCR.words.encode`. Payload: UTF-8 bytes of the space-separated word string. |

*Note*: Types `0x03` and `0x04` produce a hash string that is already in MCR$ format (legacy). For simplicity, the payload stores the resulting string as UTF-8 bytes.

## Decoding

To decode an MCR# string:

1. Remove the prefix `MCR#`.
2. Add Base64URL padding if necessary and decode to a binary buffer.
3. Extract version (first byte) and type (second byte).
4. Slice the payload (remaining bytes).
5. Interpret the payload according to the type.

## Versioning

The version byte allows future changes to the format while maintaining backward compatibility. Only version `0x01` is defined in this release.

## Example

Encrypting the plaintext `"hello"` with a random 32‑bit key and no associated data yields:

```
MCR#AoIB..." (actual value varies)
```

The decoded binary buffer starts with `01 05` (version 1, type AES-256-GCM encrypt) followed by nonce, tag, and ciphertext.

## Security Notes

- The format itself does not provide confidentiality or integrity; it is merely an encoding.
- For encryption, authenticity is ensured by the AES-256-GCM tag.
- For password hashes, the underlying Argon2id or scrypt construction provides resistance to brute‑force attacks.
- The word list is public; security relies on the entropy of the encoded data, not secrecy of the list.
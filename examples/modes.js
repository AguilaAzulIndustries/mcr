// Example: Demonstrating the three MCR modes and word‑list encoding
import MCR from 'mcr';

async function demo() {
  console.log('=== MCR Three‑Mode Demo ===\n');

  // ---------- Mode A: Crypto ----------
  console.log('1. Crypto mode (native Node.js)');
  const randBytes = MCR.crypto.randomBytes(12);
  console.log(`   Random bytes: ${randBytes.toString('hex')}`);
  const hash = MCR.crypto.createHash('sha256').update('test').digest();
  console.log(`   SHA‑256 of 'test': ${hash.toString('hex')}\n`);

  // ---------- Mode B: Argon2 ----------
  console.log('2. Argon2 mode (external library)');
  const password = 'mySecretPassword';
  const hashPromise = MCR.argon2.hash(password);
  const argon2Hash = await hashPromise;
  console.log(`   Argon2 hash: ${argon2Hash}`);
  const verify = await MCR.argon2.verify(argon2Hash, password);
  console.log(`   Verify password: ${verify}\n`);

  // ---------- Mode C: MCR own mechanisms ----------
  console.log('3. MCR own mechanisms');

  // Random generation (convenience wrappers)
  const rnd = MCR.randomBytes(8);
  console.log(`   MCR.randomBytes(8): ${rnd.toString('hex')}`);
  const token = MCR.random.token(10);
  console.log(`   MCR.random.token(10): ${token}`);

  // Password hashing (scrypt‑based, returns MCR#)
  const pwdHash = await MCR.hash.password.hash('password123');
  console.log(`   MCR hash.password: ${pwdHash}`);
  const pwdOk = await MCR.hash.password.verify('password123', pwdHash);
  console.log(`   Verify password: ${pwdOk}`);

  // AES‑256‑GCM encryption (returns MCR# string)
  const key = MCR.kdf.generateKey(32); // 256‑bit key
  const plaintext = 'Confidential data';
  const encrypted = MCR.cipher.encrypt(plaintext, { key });
  console.log(`   Encrypted (MCR#): ${encrypted}`);
  const decrypted = MCR.cipher.decrypt(encrypted, { key });
  console.log(`   Decrypted: ${decrypted.toString('utf8')}`);

  // Word‑list encoding
  const wordStr = MCR.words.encode(rnd);
  console.log(`   Words encoding: ${wordStr}`);
  const recovered = MCR.words.decode(wordStr);
  console.log(`   Round‑trip equal: ${rnd.equals(recovered)}\n`);

  console.log('Demo finished.');
}

demo().catch(console.error);
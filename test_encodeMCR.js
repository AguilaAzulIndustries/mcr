import MCR from './src/index.js';

const dictionary = ['arbol', 'nube', 'rio', 'montana', 'fuego', 'luna'];
const buf = Buffer.from('Hello');

console.log('Testing encodeMCR and decodeMCR with custom dictionary');

// Encode
const encoded = MCR.words.encodeMCR(buf, { dictionary });
console.log('Encoded:', encoded);
if (!encoded.startsWith('MCR#')) {
  console.error('ERROR: Encoded string does not start with MCR#');
  process.exit(1);
}

// Decode
const decoded = MCR.words.decodeMCR(encoded, { dictionary });
console.log('Decoded UTF-8:', decoded.toString('utf8'));
console.log('Roundtrip OK:', buf.equals(decoded));

if (!buf.equals(decoded)) {
  console.error('ERROR: Roundtrip failed');
  process.exit(1);
}

// Test with wrong dictionary
try {
  MCR.words.decodeMCR(encoded, { dictionary: ['wrong'] });
  console.error('ERROR: Should have thrown with wrong dictionary');
  process.exit(1);
} catch (e) {
  console.log('Correctly threw error with wrong dictionary:', e.message);
}

// Test with no dictionary (should use defaultDictionary)
try {
  const encoded2 = MCR.words.encodeMCR(buf);
  console.log('Encoded with default dictionary:', encoded2);
  const decoded2 = MCR.words.decodeMCR(encoded2);
  console.log('Decoded with default dictionary UTF-8:', decoded2.toString('utf8'));
  console.log('Roundtrip with default dictionary OK:', buf.equals(decoded2));
} catch (e) {
  console.error('ERROR with default dictionary:', e);
  process.exit(1);
}

console.log('All tests passed');
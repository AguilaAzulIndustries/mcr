import MCR from './src/index.js';

const dictionary = ['arbol', 'nube', 'rio', 'montana', 'fuego', 'luna'];
const buf = Buffer.from('Hola');
const encoded = MCR.words.encode(buf, { dictionary });
console.log('Encoded:', encoded);
const decoded = MCR.words.decode(encoded, { dictionary });
console.log('Decoded UTF-8:', decoded.toString('utf8'));
console.log('Roundtrip OK:', buf.equals(decoded));
const fs = require('fs');
const filepath = './src/words/index.js';
let content = fs.readFileSync(filepath, 'utf8');
// Find the array declaration
const match = content.match(/const defaultDictionary = \[([\s\S]*?)\];/);
if (!match) {
  console.error('Could not find defaultDictionary array');
  process.exit(1);
}
const arrayText = match[1];
// We'll evaluate the array literal safely by wrapping in parentheses and using Function?
// Instead, let's split by commas and parse each element as a string literal.
// This is error-prone due to possible commas inside strings.
// Better to use eval since we trust the file and it's a simple array.
let array;
try {
  // Evaluate the array literal
  array = eval('[' + arrayText + ']');
} catch (e) {
  console.error('Failed to evaluate array literal:', e);
  process.exit(1);
}
// Deduplicate while preserving order (keep first occurrence)
const seen = new Set();
const deduped = [];
for (const item of array) {
  if (!seen.has(item)) {
    seen.add(item);
    deduped.push(item);
  }
}
console.log(`Original length: ${array.length}`);
console.log(`Deduped length: ${deduped.length}`);
console.log(`Removed duplicates: ${array.length - deduped.length}`);
// Now replace the array in the content
const newArrayText = deduped.map(item => JSON.stringify(item)).join(',\n  ');
const newContent = content.replace(match[0], `const defaultDictionary = [\n  ${newArrayText}\n];`);
fs.writeFileSync(filepath, newContent);
console.log('Updated file with deduplicated array.');
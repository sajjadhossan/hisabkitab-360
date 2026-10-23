const fs = require('fs');
const path = require('path');

// Import SAMITY_DICTIONARY
const dictFilePath = path.join(__dirname, '..', 'somiti-360', 'src', 'utils', 'samityDictionary.js');
const dictContent = fs.readFileSync(dictFilePath, 'utf8');

// Extract dictionary keys using regex
const dictKeys = new Set();
const dictRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
let match;
while ((match = dictRegex.exec(dictContent)) !== null) {
  dictKeys.add(match[1]);
}

console.log(`Loaded ${dictKeys.size} dictionary entries.`);

// Scan SamityManagementHub.jsx
const hubPath = path.join(__dirname, '..', 'somiti-360', 'src', 'components', 'samity', 'SamityManagementHub.jsx');
const hubContent = fs.readFileSync(hubPath, 'utf8');

// Regex to find Bengali texts (at least one Bengali character \u0980-\u09FF)
const banglaRegex = /["'>]([\s\S]*?[\u0980-\u09FF][\s\S]*?)["'<]/g;
const foundStrings = new Map();

const lines = hubContent.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('//') && line.trim().startsWith('//')) continue; // Skip comments
  
  // Find all matches in this line
  let m;
  const lineRegex = /(["'`])([^"'`]*[\u0980-\u09FF][^"'`]*)\1|>([^<]*[\u0980-\u09FF][^<]*)<|placeholder=(["'])([^"']*[\u0980-\u09FF][^"']*)\4/g;
  while ((m = lineRegex.exec(line)) !== null) {
    const raw = (m[2] || m[3] || m[5] || '').trim();
    if (raw && raw.length > 1 && !raw.startsWith('{') && !raw.startsWith('t(')) {
      if (!dictKeys.has(raw)) {
        foundStrings.set(raw, (foundStrings.get(raw) || 0) + 1);
      }
    }
  }
}

console.log(`Found ${foundStrings.size} unique Bengali strings that are NOT directly in SAMITY_DICTIONARY.`);

// Write untranslated strings to JSON for inspection
const untranslated = Array.from(foundStrings.entries()).map(([text, count]) => ({ text, count }));
fs.writeFileSync(path.join(__dirname, 'untranslated_strings.json'), JSON.stringify(untranslated, null, 2), 'utf8');
console.log('Saved to scripts/untranslated_strings.json');

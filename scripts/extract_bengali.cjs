const fs = require('fs');

const content = fs.readFileSync('src/components/samity/SamityManagementHub.jsx', 'utf8');
const regex = /[\u0980-\u09FF][^\n"'`<>{}()[\],;]*[\u0980-\u09FF]/g;
const matches = content.match(regex) || [];
const unique = [...new Set(matches.map(s => s.trim()))].filter(s => s.length > 1);
console.log('Total unique Bengali phrases found:', unique.length);
console.log('Sample 30 phrases:', JSON.stringify(unique.slice(0, 30), null, 2));

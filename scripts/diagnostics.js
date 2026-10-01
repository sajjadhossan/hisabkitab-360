import fs from 'fs';
import path from 'path';

const srcDir = './src';

function getAllFiles(dir, exts = ['.js', '.jsx']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const allSrcFiles = getAllFiles(srcDir);
console.log(`Analyzing ${allSrcFiles.length} source files...`);

// 1. Check for unsafe localStorage.getItem without try/catch
const unsafeStoragePatterns = [];
for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('JSON.parse(localStorage.getItem(') && !content.slice(Math.max(0, content.indexOf(line) - 200), content.indexOf(line)).includes('try')) {
      unsafeStoragePatterns.push({ file, line: i + 1, snippet: line.trim() });
    }
  });
}

// 2. Check for missing imports of AppContext properties
const appContextContent = fs.readFileSync('./src/context/AppContext.jsx', 'utf8');
// Extract all keys provided by AppContext Provider value
const providerValueMatch = appContextContent.match(/<AppContext\.Provider[\s\S]*?value=\{\{([\s\S]*?)\}\}/);
const providedKeys = new Set();
if (providerValueMatch) {
  const rawKeys = providerValueMatch[1].split(/[\n,]/).map(k => k.trim()).filter(Boolean);
  for (const k of rawKeys) {
    if (k && !k.startsWith('//')) {
      const cleanKey = k.split(':')[0].trim();
      if (/^[a-zA-Z0-9_$]+$/.test(cleanKey)) {
        providedKeys.add(cleanKey);
      }
    }
  }
}

console.log(`AppContext provides ${providedKeys.size} context properties/handlers.`);

const missingContextKeys = [];
for (const file of allSrcFiles) {
  if (file.includes('AppContext.jsx')) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('useApp(')) {
    // Find destructuring: const { a, b, c } = useApp();
    const matches = content.matchAll(/(?:const|let)\s*\{([^}]+)\}\s*=\s*useApp\(\)/g);
    for (const match of matches) {
      const destructured = match[1].split(',').map(s => s.trim().split(':')[0].split('=')[0].trim()).filter(Boolean);
      for (const d of destructured) {
        if (!providedKeys.has(d) && !d.startsWith('//')) {
          missingContextKeys.push({ file, key: d });
        }
      }
    }
  }
}

console.log(`\n--- DIAGNOSTIC RESULTS ---`);
console.log(`Unsafe direct JSON.parse(localStorage): ${unsafeStoragePatterns.length}`);
unsafeStoragePatterns.forEach(p => console.log(`  [WARN] ${p.file}:${p.line} -> ${p.snippet}`));

console.log(`\nMissing AppContext Destructuring Keys: ${missingContextKeys.length}`);
missingContextKeys.forEach(p => console.log(`  [MISSING KEY] in ${p.file}: "${p.key}"`));

console.log(`\nDiagnostic Scan Complete.`);

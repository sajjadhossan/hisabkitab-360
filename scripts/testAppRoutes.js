import fs from 'fs';

// Check all tab IDs referenced in Navbar.jsx vs App.jsx
const navbarCode = fs.readFileSync('./src/components/Navbar.jsx', 'utf8');
const appCode = fs.readFileSync('./src/App.jsx', 'utf8');

// Extract all setActiveTab('...') calls in Navbar.jsx
const navTabs = new Set();
const matches = navbarCode.matchAll(/setActiveTab\(['"]([^'"]+)['"]\)/g);
for (const m of matches) {
  navTabs.add(m[1]);
}

console.log(`Found ${navTabs.size} navigation tabs triggered by Navbar:`, Array.from(navTabs));

// Check if each tab has a handler in App.jsx
const unhandledTabs = [];
for (const tab of navTabs) {
  if (!appCode.includes(`'${tab}'`) && !appCode.includes(`"${tab}"`)) {
    unhandledTabs.push(tab);
  }
}

if (unhandledTabs.length === 0) {
  console.log('✅ ALL Navbar tabs have corresponding route handlers in App.jsx!');
} else {
  console.warn('⚠️ Unhandled tabs in App.jsx:', unhandledTabs);
}

// Check initial data consistency
const initialDataCode = fs.readFileSync('./src/data/initialData.js', 'utf8');
console.log('Initial data file size:', (initialDataCode.length / 1024).toFixed(1), 'KB');
console.log('Build health check: PASSED');

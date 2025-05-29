#!/usr/bin/env node

/**
 * Test script for placeholder replacement
 * This script verifies that all placeholders in the codebase can be handled by the setup script
 */

const fs = require('fs');
const path = require('path');

// Import placeholder configuration from setup.js
const setupScriptPath = path.join(__dirname, 'setup.js');
const setupScriptContent = fs.readFileSync(setupScriptPath, 'utf8');

// Extract FILES_TO_PROCESS array and PLACEHOLDERS object using regex (hacky but works for testing)
const filesRegex = /const FILES_TO_PROCESS = \[([\s\S]*?)\];/;
const placeholdersRegex = /const PLACEHOLDERS = {([\s\S]*?)};/;

const filesMatch = setupScriptContent.match(filesRegex);
const placeholdersMatch = setupScriptContent.match(placeholdersRegex);

if (!filesMatch || !placeholdersMatch) {
  console.error('Failed to extract FILES_TO_PROCESS or PLACEHOLDERS from setup.js');
  process.exit(1);
}

// Evaluate the FILES_TO_PROCESS array
const FILES_TO_PROCESS = eval(`[${filesMatch[1]}]`);

// Extract placeholder keys
const placeholdersContent = placeholdersMatch[1];
const placeholderKeys = placeholdersContent.match(/YOUR_[A-Z_]+(?=:)/g);

console.log('Placeholders handled by setup.js:');
console.log(placeholderKeys);
console.log('\nFiles processed by setup.js:');
console.log(FILES_TO_PROCESS);

// Find all placeholder patterns in the codebase
console.log('\nScanning codebase for placeholder patterns...');

const excludeDirs = ['node_modules', '.git', '.next', 'coverage', 'logs'];
const allPlaceholders = new Set();

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip excluded directories
    if (entry.isDirectory() && excludeDirs.includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const placeholderMatches = content.match(/{{YOUR_[A-Z_]+}}/g);

        if (placeholderMatches) {
          for (const match of placeholderMatches) {
            allPlaceholders.add(match);
          }
        }
      } catch (error) {
        // Skip binary files or files with read errors
      }
    }
  }
}

// Start scanning from the project root
scanDirectory(path.join(__dirname, '..'));

console.log('\nAll placeholder patterns found in codebase:');
const allPlaceholdersArray = Array.from(allPlaceholders).sort();
console.log(allPlaceholdersArray);

// Check if all found placeholders are handled by setup.js
const missingPlaceholders = allPlaceholdersArray.filter(placeholder => {
  // Extract the key without {{ and }}
  const key = placeholder.slice(2, -2);
  return !placeholderKeys.includes(key);
});

if (missingPlaceholders.length > 0) {
  console.log('\n⚠️ WARNING: Some placeholders are not handled by setup.js:');
  console.log(missingPlaceholders);
} else {
  console.log('\n✅ All placeholders found in the codebase are handled by setup.js');
}

// Make the test script executable
console.log('\nMaking this script executable: chmod +x scripts/test-placeholder-replacement.js');
fs.chmodSync(__filename, '755');

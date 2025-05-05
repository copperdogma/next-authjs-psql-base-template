module.exports = {
  // Lint TypeScript files with the exact same command format as npm scripts
  '**/*.ts?(x)': filenames => [
    // Match the npm lint:files script format but with specific files
    `ESLINT_USE_FLAT_CONFIG=true eslint --fix ${filenames.join(' ')}`,
    `npm run format -- ${filenames.join(' ')}`,
    `git add ${filenames.join(' ')}`,
  ],

  // Format MarkDown files
  '**/*.md': filenames => [
    `npm run format -- ${filenames.join(' ')}`,
    `git add ${filenames.join(' ')}`,
  ],

  // Format JSON files
  '**/*.json': filenames => [
    `npm run format -- ${filenames.join(' ')}`,
    `git add ${filenames.join(' ')}`,
  ],
};

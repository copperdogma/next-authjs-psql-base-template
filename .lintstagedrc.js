module.exports = {
  // Lint TypeScript files with the exact same command format as npm scripts
  '**/*.ts?(x)': filenames => [
    // Call the npm script directly to ensure consistent environment
    `npm run lint:files -- ${filenames.join(' ')}`,
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

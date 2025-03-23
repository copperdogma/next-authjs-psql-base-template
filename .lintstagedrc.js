module.exports = {
  // Lint TypeScript files
  '**/*.ts?(x)': filenames => [
    `npm run lint:fix -- ${filenames.join(' ')}`,
    `npm run format -- ${filenames.join(' ')}`,
  ],

  // Format MarkDown files
  '**/*.md': filenames => [`npm run format -- ${filenames.join(' ')}`],

  // Format JSON files
  '**/*.json': filenames => [`npm run format -- ${filenames.join(' ')}`],
};

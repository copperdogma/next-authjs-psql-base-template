module.exports = {
  // Lint TypeScript files
  '**/*.ts?(x)': filenames => [
    `ESLINT_USE_FLAT_CONFIG=true npx eslint --fix --no-error-on-unmatched-pattern ${filenames.join(' ')}`,
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

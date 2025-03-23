# Code Formatting Configuration

This document explains how automatic code formatting is configured in this project.

## Overview

This project implements automatic code formatting at multiple stages of the development workflow. This is particularly important for AI-driven development workflows, where formatting may be overlooked.

## Implementation Details

### 1. Build Process Integration

The project includes automatic formatting via npm `pre` scripts:

```json
"predev": "prettier --write .",
"prebuild": "prettier --write ."
```

These hooks ensure that **every time** someone runs `npm run dev` or `npm run build`, all files are formatted automatically. This is the earliest point at which formatting can be applied and ensures that even AI-generated code is properly formatted.

### 2. Git Pre-commit Hook

The `.husky/pre-commit` hook uses lint-staged to format files before they are committed:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

The `.lintstagedrc.js` configuration ensures files are formatted and re-staged:

```js
module.exports = {
  '**/*.ts?(x)': filenames => [
    `npm run lint:fix -- ${filenames.join(' ')}`,
    `npm run format -- ${filenames.join(' ')}`,
    'git add',
  ],
  '**/*.md': filenames => [`npm run format -- ${filenames.join(' ')}`, 'git add'],
  '**/*.json': filenames => [`npm run format -- ${filenames.join(' ')}`, 'git add'],
};
```

The critical part is the `'git add'` command, which re-stages files after they've been formatted. This prevents the issue where formatting changes remain unstaged after committing.

### 3. Editor Integration

The `.vscode/settings.json` file is configured for automatic formatting on save:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### 4. Convenience Scripts

The project includes convenience scripts for combined operations:

```json
"format:all": "prettier --write \"**/*.{js,jsx,ts,tsx,md,json,css,html}\"",
"dev:clean": "npm run format && npm run lint:fix && npm run dev",
"build:clean": "npm run format && npm run lint:fix && npm run build"
```

## Why This Approach?

This multi-layered approach to formatting ensures:

1. **Consistency**: Code is always formatted regardless of how it was created
2. **No Surprises**: Formatting happens early and automatically
3. **AI-Friendly**: Format-on-build ensures AI-generated code is formatted
4. **Clean Commits**: Formatting changes are properly staged

## Troubleshooting

If you notice formatting issues:

1. Ensure Prettier is installed (`npm install`)
2. Try running `npm run format` manually
3. Check if VS Code has the Prettier extension installed
4. Verify the `.prettierrc` and `.prettierignore` files are properly configured

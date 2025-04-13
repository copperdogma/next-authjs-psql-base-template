#!/usr/bin/env node

/**
 * E2E Testing Dependencies Check
 *
 * This script verifies that all dependencies required for E2E testing are
 * properly installed and available.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chalk = require('../node_modules/chalk');

console.log(chalk.blue('Checking E2E testing dependencies...'));

// Check if start-server-and-test is in package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const hasStartServerAndTest =
  (packageJson.dependencies && packageJson.dependencies['start-server-and-test']) ||
  (packageJson.devDependencies && packageJson.devDependencies['start-server-and-test']);

// Check other tools via direct commands
const commandDeps = [
  { name: 'playwright', command: 'npx playwright --version' },
  { name: 'firebase-tools', command: 'npx firebase --version' },
];

let allDepsInstalled = hasStartServerAndTest;

if (hasStartServerAndTest) {
  console.log(chalk.green(`✓ start-server-and-test is installed (from package.json)`));
} else {
  console.error(chalk.red(`✗ start-server-and-test is NOT properly installed.`));
  console.error(chalk.yellow(`  Try running: npm install --save-dev start-server-and-test`));
}

for (const dep of commandDeps) {
  try {
    const output = execSync(dep.command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    console.log(chalk.green(`✓ ${dep.name} is installed (${output})`));
  } catch (error) {
    console.error(chalk.red(`✗ ${dep.name} is NOT properly installed.`));
    console.error(chalk.yellow(`  Try running: npm install --save-dev ${dep.name}`));
    allDepsInstalled = false;
  }
}

if (allDepsInstalled) {
  console.log(chalk.green('\n✓ All E2E dependencies are properly installed!'));
  console.log(chalk.blue('You can now run E2E tests with: npm run test:e2e'));
} else {
  console.error(
    chalk.red('\n✗ Some E2E dependencies are missing. Please install them before running tests.')
  );
  console.log(chalk.blue('After installing missing dependencies, you can run: npm run test:e2e'));
  process.exit(1);
}

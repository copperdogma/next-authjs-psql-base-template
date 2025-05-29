#!/usr/bin/env node

/**
 * Project Setup Script
 * This script initializes your project by replacing placeholders and configuring environment variables.
 */

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const chalk = require('chalk');
const inquirer = require('inquirer');

// Directories to search for placeholder replacement
const FILES_TO_PROCESS = [
  'package.json',
  'package-lock.json',
  'README.md',
  'SETUP.md',
  'LICENSE',
  'app/manifest.ts',
  'tests/utils/test-constants.ts',
  'tests/README-main.md',
  'tests/simple-layout-test.js',
  'docs/testing',
  'docs/temp_project_reference_update.md',
  'scratchpad.md',
  'scratchpad-docs.md',
];

// Placeholders to replace with user input
const PLACEHOLDERS = {
  YOUR_PROJECT_NAME: {
    prompt: 'Project name (lowercase, hyphenated)',
    default: path.basename(process.cwd()),
    validate: input =>
      /^[a-z0-9-]+$/.test(input) ? true : 'Project name must be lowercase and hyphenated',
  },
  YOUR_PROJECT_DESCRIPTION: {
    prompt: 'Project description',
    default: 'A Next.js application with NextAuth.js and PostgreSQL',
  },
  YOUR_COPYRIGHT_HOLDER: {
    prompt: 'Copyright holder name',
    default: 'Your Name or Organization',
  },
  YOUR_PROJECT_URL: {
    prompt: 'Project URL',
    default: 'https://example.com',
  },
  YOUR_REPOSITORY_URL: {
    prompt: 'Repository URL',
    default: 'https://github.com/yourusername/your-repo',
  },
  YOUR_AUTHOR_NAME: {
    prompt: 'Author name',
    default: 'Your Name',
  },
  YOUR_AUTHOR_EMAIL: {
    prompt: 'Author email',
    default: 'your.email@example.com',
  },
  YOUR_APP_TITLE: {
    prompt: 'Application title (displayed in browser)',
    default: answers => answers.YOUR_PROJECT_NAME.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  },
  YOUR_APP_SHORT_NAME: {
    prompt: 'Application short name (for PWA)',
    default: answers => answers.YOUR_PROJECT_NAME.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  },
  YOUR_APP_NAME: {
    prompt: 'Application name (used in code references)',
    default: answers => answers.YOUR_PROJECT_NAME.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  },
  YOUR_APP_DESCRIPTION: {
    prompt: 'Application description (used in env vars)',
    default: answers => answers.YOUR_PROJECT_DESCRIPTION,
  },
  YOUR_DATABASE_NAME_DEV: {
    prompt: 'Development database name',
    default: answers => `${answers.YOUR_PROJECT_NAME.replace(/-/g, '_')}_dev`,
  },
  YOUR_DATABASE_NAME_TEST: {
    prompt: 'Test database name',
    default: answers => `${answers.YOUR_PROJECT_NAME.replace(/-/g, '_')}_test`,
  },
  YOUR_DATABASE_NAME: {
    prompt: 'Database name (generic)',
    default: answers => `${answers.YOUR_PROJECT_NAME.replace(/-/g, '_')}`,
  },
};

/**
 * Generate a secure random string for use as NEXTAUTH_SECRET
 */
function generateSecureSecret() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Setup environment variables by creating .env.local from .env.example
 */
async function setupEnvironment(answers) {
  console.log(chalk.blue('Setting up environment variables...'));

  // Check if .env.local already exists
  if (fs.existsSync('.env.local')) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: '.env.local already exists. Overwrite?',
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('Skipping environment setup.'));

      return;
    }
  }

  // Copy .env.example to .env.local if it doesn't exist or user confirmed overwrite
  try {
    if (!fs.existsSync('.env.example')) {
      console.error(chalk.red('.env.example file not found. Cannot set up environment variables.'));

      return;
    }

    let envContent = fs.readFileSync('.env.example', 'utf8');

    // Collect critical environment variables
    const { DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIS_URL } =
      await inquirer.prompt([
        {
          type: 'input',
          name: 'DATABASE_URL',
          message: 'PostgreSQL database URL',
          default: `postgresql://postgres:postgres@localhost:5432/${answers.DATABASE_NAME_DEV}`,
        },
        {
          type: 'input',
          name: 'GOOGLE_CLIENT_ID',
          message: 'Google OAuth Client ID (leave empty to configure later)',
          default: '',
        },
        {
          type: 'input',
          name: 'GOOGLE_CLIENT_SECRET',
          message: 'Google OAuth Client Secret (leave empty to configure later)',
          default: '',
        },
        {
          type: 'input',
          name: 'REDIS_URL',
          message: 'Redis URL (optional, leave empty if not using Redis)',
          default: '',
        },
      ]);

    // Generate a secure NEXTAUTH_SECRET
    const NEXTAUTH_SECRET = generateSecureSecret();

    // Replace placeholders in .env.example
    envContent = envContent
      .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${DATABASE_URL}"`)
      .replace(/^NEXTAUTH_SECRET=.*$/m, `NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"`)
      .replace(/^GOOGLE_CLIENT_ID=.*$/m, `GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}"`)
      .replace(/^GOOGLE_CLIENT_SECRET=.*$/m, `GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}"`);

    // Only update REDIS_URL if provided
    if (REDIS_URL) {
      envContent = envContent.replace(/^# REDIS_URL=.*$/m, `REDIS_URL="${REDIS_URL}"`);

      // Uncomment ENABLE_REDIS_RATE_LIMITING
      envContent = envContent.replace(
        /^# ENABLE_REDIS_RATE_LIMITING=.*$/m,
        `ENABLE_REDIS_RATE_LIMITING="true"`
      );
    }

    // Write to .env.local
    fs.writeFileSync('.env.local', envContent);
    console.log(chalk.green('✅ Environment variables configured successfully in .env.local'));

    return;
  } catch (error) {
    console.error(chalk.red(`Error setting up environment variables: ${error.message}`));

    return;
  }
}

/**
 * Replace placeholders in all target files
 */
async function replacePlaceholders() {
  console.log(chalk.blue('Replacing placeholders in project files...'));

  try {
    // Collect user input for all placeholders
    const answers = await inquirer.prompt(
      Object.entries(PLACEHOLDERS).map(([key, config]) => ({
        type: 'input',
        name: key,
        message: config.prompt,
        default: typeof config.default === 'function' ? config.default({}) : config.default,
        validate: config.validate,
      }))
    );

    // Update default database names if they weren't modified
    Object.entries(PLACEHOLDERS)
      .filter(([key]) => key.includes('DATABASE_NAME_'))
      .forEach(([key]) => {
        if (typeof PLACEHOLDERS[key].default === 'function') {
          const generatedDefault = PLACEHOLDERS[key].default(answers);
          if (answers[key] === PLACEHOLDERS[key].default) {
            answers[key] = generatedDefault;
          }
        }
      });

    // Process each target file/directory
    for (const target of FILES_TO_PROCESS) {
      const targetPath = path.join(process.cwd(), target);

      if (!fs.existsSync(targetPath)) {
        console.log(chalk.yellow(`⚠️ Skipping non-existent path: ${target}`));
        continue;
      }

      if (fs.statSync(targetPath).isDirectory()) {
        // Process all files in directory recursively
        processDirectory(targetPath, answers);
      } else {
        // Process single file
        processFile(targetPath, answers);
      }
    }

    console.log(chalk.green('✅ Placeholders replaced successfully'));

    // Setup environment variables
    await setupEnvironment(answers);

    return true;
  } catch (error) {
    console.error(chalk.red(`Error replacing placeholders: ${error.message}`));

    return false;
  }
}

/**
 * Process all files in a directory recursively
 */
function processDirectory(dirPath, answers) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      processDirectory(filePath, answers);
    } else {
      processFile(filePath, answers);
    }
  }
}

/**
 * Process a single file and replace placeholders
 */
function processFile(filePath, answers) {
  try {
    const extension = path.extname(filePath).toLowerCase();
    const supportedExtensions = [
      '.json',
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.md',
      '.mdx',
      '.html',
      '.css',
      '.txt',
    ];
    
    // For any file in docs/testing or with .md extension, we should always process
    const shouldAlwaysProcess = 
      filePath.includes('docs/testing') || 
      filePath.includes('tests/README-main.md') || 
      extension === '.md';

    if (!shouldAlwaysProcess && !supportedExtensions.includes(extension)) {
      return; // Skip unsupported file types
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace each placeholder
    Object.entries(answers).forEach(([placeholder, value]) => {
      const regex = new RegExp(`{{${placeholder}}}`, 'g');
      if (content.match(regex)) {
        content = content.replace(regex, value);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(chalk.green(`✅ Updated: ${filePath}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error processing file ${filePath}: ${error.message}`));
  }
}

/**
 * Main function to run the setup
 */
async function main() {
  console.log(chalk.blue.bold('🚀 Setting up your Next.js + NextAuth.js + PostgreSQL project...'));

  const success = await replacePlaceholders();

  if (success) {
    console.log(chalk.green.bold('✅ Setup completed successfully!'));
    console.log(chalk.blue('Next steps:'));
    console.log(chalk.blue('1. Run `npm install` to install dependencies'));
    console.log(chalk.blue('2. Set up your PostgreSQL database'));
    console.log(
      chalk.blue('3. Run `npx prisma migrate dev --name init` to create database tables')
    );
    console.log(chalk.blue('4. Run `npm run dev` to start the development server'));
  } else {
    console.log(chalk.red.bold('❌ Setup encountered errors. Please check the logs above.'));
  }
}

// Run the script
main();

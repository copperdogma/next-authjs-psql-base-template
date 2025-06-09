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

// Function to get the prompt method
const getPromptMethod = () => {
  if (inquirer.default && typeof inquirer.default.prompt === 'function') {
    return inquirer.default.prompt; // For inquirer v9+ ESM wrapped in CJS
  }
  if (typeof inquirer.prompt === 'function') {
    return inquirer.prompt; // For inquirer v8 or compatible
  }
  throw new Error('Inquirer.prompt function not found. Incompatible Inquirer version.');
};

const promptUser = getPromptMethod();

// Function to load answers from a JSON file
function loadAnswersFromFile(filePath) {
  console.log(
    chalk.yellow(`Attempting to load answers from: ${filePath}`),
    'CWD for answers load:',
    process.cwd()
  );
  if (fs.existsSync(filePath)) {
    try {
      const rawData = fs.readFileSync(filePath);

      return JSON.parse(rawData);
    } catch (error) {
      console.warn(
        chalk.yellow(
          `Warning: Could not read or parse ${filePath}. Proceeding with interactive prompts. Error: ${error.message}`
        )
      );

      return {};
    }
  }

  return {};
}

const preloadedAnswers = loadAnswersFromFile(path.join(process.cwd(), 'setup-answers.json'));

// Directories to search for placeholder replacement
const FILES_TO_PROCESS = [
  'package.json',
  'package-lock.json',
  'README.md',
  'SETUP.md',
  'LICENSE',
  'app/manifest.ts',
  'tests/utils/test-constants.ts',
      'tests/README.md',
  'scripts/test-debug-helpers/simple-layout-test.js',
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
    default: answers =>
      (answers.YOUR_PROJECT_NAME || '').replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()),
  },
  YOUR_APP_SHORT_NAME: {
    prompt: 'Application short name (for PWA)',
    default: answers =>
      (answers.YOUR_PROJECT_NAME || '').replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()),
  },
  YOUR_APP_NAME: {
    prompt: 'Application name (used in code references)',
    default: answers =>
      (answers.YOUR_PROJECT_NAME || '').replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()),
  },
  YOUR_APP_DESCRIPTION: {
    prompt: 'Application description (used in env vars)',
    default: answers => answers.YOUR_PROJECT_DESCRIPTION,
  },
  YOUR_DATABASE_NAME_DEV: {
    prompt: 'Development database name',
    default: answers => `${(answers.YOUR_PROJECT_NAME || '').replace(/-/g, '_')}_dev`,
  },
  YOUR_DATABASE_NAME_TEST: {
    prompt: 'Test database name',
    default: answers => `${(answers.YOUR_PROJECT_NAME || '').replace(/-/g, '_')}_test`,
  },
  YOUR_DATABASE_NAME: {
    prompt: 'Database name (generic)',
    default: answers => `${(answers.YOUR_PROJECT_NAME || '').replace(/-/g, '_')}`,
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
async function setupEnvironment(initialAnswers) {
  console.log(chalk.blue('Setting up environment variables...'));

  if (fs.existsSync('.env.local') && !initialAnswers.overwriteEnv) {
    // Allow overwrite via preloadedAnswers
    const { overwrite } = await promptUser(
      [
        // Use the determined prompt method
        {
          type: 'confirm',
          name: 'overwrite',
          message: '.env.local already exists. Overwrite?',
          default: false,
        },
      ],
      initialAnswers
    ); // Pass initialAnswers to allow pre-filling 'overwrite' if needed

    if (!overwrite && !initialAnswers.overwriteEnv) {
      console.log(chalk.yellow('Skipping environment setup.'));

      return;
    }
  }

  try {
    if (!fs.existsSync('.env.example')) {
      console.error(chalk.red('.env.example file not found. Cannot set up environment variables.'));

      return;
    }

    let envContent = fs.readFileSync('.env.example', 'utf8');

    const questions = [
      {
        type: 'input',
        name: 'DATABASE_URL',
        message: 'PostgreSQL database URL',
        default: `postgresql://postgres:postgres@localhost:5432/${initialAnswers.YOUR_DATABASE_NAME_DEV || PLACEHOLDERS.YOUR_DATABASE_NAME_DEV.default(initialAnswers)}`,
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
    ];

    const envAnswers = await promptUser(questions, initialAnswers); // Pass initialAnswers here

    const DATABASE_URL = envAnswers.DATABASE_URL || initialAnswers.DATABASE_URL;
    const GOOGLE_CLIENT_ID = envAnswers.GOOGLE_CLIENT_ID || initialAnswers.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET =
      envAnswers.GOOGLE_CLIENT_SECRET || initialAnswers.GOOGLE_CLIENT_SECRET;
    const REDIS_URL = envAnswers.REDIS_URL || initialAnswers.REDIS_URL;

    const NEXTAUTH_SECRET = generateSecureSecret();

    envContent = envContent
      .replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${DATABASE_URL}"`)
      .replace(/^NEXTAUTH_SECRET=.*$/m, `NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"`)
      .replace(/^GOOGLE_CLIENT_ID=.*$/m, `GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}"`)
      .replace(/^GOOGLE_CLIENT_SECRET=.*$/m, `GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}"`);

    if (REDIS_URL) {
      envContent = envContent.replace(/^# REDIS_URL=.*$/m, `REDIS_URL="${REDIS_URL}"`);
      envContent = envContent.replace(
        /^# ENABLE_REDIS_RATE_LIMITING=.*$/m,
        `ENABLE_REDIS_RATE_LIMITING="true"`
      );
    }

    // Write to .env.local
    const envLocalPath = path.join(process.cwd(), '.env.local');
    console.log(
      chalk.yellow(`Attempting to write .env.local to: ${envLocalPath}`),
      'CWD for .env.local write:',
      process.cwd()
    );
    fs.writeFileSync('.env.local', envContent);
    console.log(chalk.green('✅ Environment variables configured successfully in .env.local'));
  } catch (error) {
    console.error(chalk.red(`Error setting up environment variables: ${error.message}`));
  }
}

/**
 * Replace placeholders in all target files
 */
async function replacePlaceholders() {
  console.log(chalk.blue('Replacing placeholders in project files...'));

  try {
    const questions = Object.entries(PLACEHOLDERS).map(([key, config]) => ({
      type: 'input',
      name: key,
      message: config.prompt,
      default:
        typeof config.default === 'function'
          ? config.default(preloadedAnswers)
          : preloadedAnswers[key] || config.default,
      validate: config.validate,
    }));

    // Pass preloadedAnswers to promptUser. It will use these values if present.
    const answersFromPrompt = await promptUser(questions, preloadedAnswers);

    // Combine preloaded answers with any answers obtained from the prompt (if some were not preloaded)
    // Prioritize answers from prompt if a field was interactively filled.
    const finalAnswers = { ...preloadedAnswers, ...answersFromPrompt };

    // Ensure dynamic defaults are correctly resolved using the final set of answers if not prompted
    Object.entries(PLACEHOLDERS).forEach(([key, config]) => {
      if (typeof config.default === 'function' && finalAnswers[key] === undefined) {
        finalAnswers[key] = config.default(finalAnswers);
      } else if (finalAnswers[key] === undefined) {
        finalAnswers[key] = config.default;
      }

      // If the default was a function and inquirer used it, the value is already set.
      // If a value was preloaded, it's used.
      // If no value was preloaded, and default is a function, calculate it now.
      // This re-evaluates defaults for any values not provided by preloadedAnswers or interactively.
      if (typeof config.default === 'function') {
        if (!preloadedAnswers.hasOwnProperty(key) && !answersFromPrompt.hasOwnProperty(key)) {
          // If not preloaded and not answered by prompt, calculate default based on other final answers
          finalAnswers[key] = config.default(finalAnswers);
        } else if (
          preloadedAnswers.hasOwnProperty(key) &&
          typeof PLACEHOLDERS[key].default === 'function' &&
          preloadedAnswers[key] === PLACEHOLDERS[key].default(preloadedAnswers)
        ) {
          // if preloaded answer is the same as its default function evaluated with preloaded answers, re-evaluate with finalAnswers
          finalAnswers[key] = PLACEHOLDERS[key].default(finalAnswers);
        }
      } else if (finalAnswers[key] === undefined) {
        finalAnswers[key] = config.default;
      }

      // Ensure all placeholder keys exist in finalAnswers, even if empty string
      if (finalAnswers[key] === undefined) {
        finalAnswers[key] = '';
      }
    });

    for (const target of FILES_TO_PROCESS) {
      const targetPath = path.join(process.cwd(), target);
      if (!fs.existsSync(targetPath)) {
        console.log(chalk.yellow(`⚠️ Skipping non-existent path: ${target}`));
        continue;
      }
      if (fs.statSync(targetPath).isDirectory()) {
        processDirectory(targetPath, finalAnswers);
      } else {
        processFile(targetPath, finalAnswers);
      }
    }

    console.log(chalk.green('✅ Placeholders replaced successfully'));
    await setupEnvironment(finalAnswers); // Pass the final answers

    return true;
  } catch (error) {
    console.error(chalk.red(`Error replacing placeholders: ${error.message}`));
    if (error.isTtyError) {
      console.error(
        chalk.red(
          'This script needs to be run in an interactive terminal, or have answers pre-filled via setup-answers.json.'
        )
      );
    }

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
      filePath.includes('tests/README.md') ||
      extension === '.md';

    if (!shouldAlwaysProcess && !supportedExtensions.includes(extension)) {
      return; // Skip unsupported file types
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace each placeholder
    Object.entries(answers).forEach(([placeholder, value]) => {
      // Ensure value is a string for replacement; null/undefined can cause issues
      const replacementValue = value === null || value === undefined ? '' : String(value);
      const regex = new RegExp(`{{${placeholder}}}`, 'g');
      if (content.match(regex)) {
        content = content.replace(regex, replacementValue);
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

  // Add a check for non-interactive environment if no answers are preloaded
  const isNonInteractive = !process.stdin.isTTY;
  const hasPreloadedAnswers = Object.keys(preloadedAnswers).length > 0;

  if (isNonInteractive && !hasPreloadedAnswers) {
    console.error(
      chalk.red('Error: Running in a non-interactive environment without pre-filled answers.')
    );
    console.error(
      chalk.red(
        'Please run this script in an interactive terminal or provide a setup-answers.json file.'
      )
    );
    process.exit(1);
  }

  // Add YOUR_PROJECT_NAME to preloadedAnswers if not present, for default functions
  if (!preloadedAnswers.YOUR_PROJECT_NAME) {
    preloadedAnswers.YOUR_PROJECT_NAME = path.basename(process.cwd());
  }

  const success = await replacePlaceholders();

  if (success) {
    console.log(chalk.green.bold('✅ Setup completed successfully!'));
    console.log(chalk.blue('Next steps:'));

    // console.log(chalk.blue('1. Run `npm install` to install dependencies')); // Already done
    console.log(chalk.blue('1. Ensure your PostgreSQL server is running and accessible.'));
    console.log(
      chalk.blue('2. The DATABASE_URL in .env.local has been set to:'),
      chalk.yellow(
        preloadedAnswers.DATABASE_URL ||
          `postgresql://postgres:postgres@localhost:5432/${preloadedAnswers.YOUR_DATABASE_NAME_DEV || 'YOUR_PROJECT_NAME_dev'}`
      )
    );
    console.log(
      chalk.blue(
        '3. Run `npx dotenv-cli -e .env.local npx prisma migrate dev` to create database tables.'
      )
    );
    console.log(chalk.blue('4. Run `npm run dev` to start the development server.'));
  } else {
    console.log(chalk.red.bold('❌ Setup encountered errors. Please check the logs above.'));
  }
}

// Run the script
main();

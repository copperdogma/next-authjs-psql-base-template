#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// For inquirer v12+, we need to use dynamic import
async function getInquirer() {
  try {
    // Use dynamic import for ESM compatibility
    return await import('inquirer');
  } catch (error) {
    console.error('Error importing inquirer:', error);
    console.log('You may need to run: npm install inquirer');
    process.exit(1);
  }
}

// Define our placeholder tokens
const PLACEHOLDERS = {
  PROJECT_NAME: '{{YOUR_PROJECT_NAME}}',
  PROJECT_DESCRIPTION: '{{YOUR_PROJECT_DESCRIPTION}}',
  REPOSITORY_URL: '{{YOUR_REPOSITORY_URL}}',
  DATABASE_NAME: '{{YOUR_DATABASE_NAME}}',
  DATABASE_NAME_DEV: '{{YOUR_DATABASE_NAME_DEV}}',
  DATABASE_NAME_TEST: '{{YOUR_DATABASE_NAME_TEST}}',
  APP_TITLE: '{{YOUR_APP_TITLE}}',
  APP_SHORT_NAME: '{{YOUR_APP_SHORT_NAME}}',
  COPYRIGHT_HOLDER: '{{YOUR_COPYRIGHT_HOLDER}}',
};

// Files that need to be processed
const FILES_TO_PROCESS = [
  'package.json',
  'package-lock.json',
  'README.md',
  '.env.example',
  'app/manifest.ts',
  'app/layout.tsx',
  'app/page.tsx',
  'components/layouts/BaseLayout.tsx',
  'docs/requirements.md',
  'docs/design.md',
  'docs/architecture.md',
  'docs/stories.md',
  'docs/testing/index.md',
  'docs/testing/main.md',
  'docs/testing/e2e-testing.md',
  'tests/utils/test-constants.ts',
  'tests/README-main.md',
  'tests/simple-layout-test.js',
  'SETUP.md',
  'LICENSE',
  '.cursor/rules/project-reference.mdc',
  '.cursor/rules/testing.mdc',
];

async function replaceInFile(filePath, replacements) {
  try {
    let content = await fs.readFile(filePath, 'utf8');

    // Perform all replacements
    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(placeholder, 'g');
      content = content.replace(regex, value);
    }

    await fs.writeFile(filePath, content, 'utf8');
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

async function updateFiles(answers) {
  const projectNameSlug = answers.projectName.toLowerCase().replace(/\s+/g, '-');
  
  const replacements = {
    '{{YOUR_PROJECT_NAME}}': projectNameSlug,
    '{{YOUR_PROJECT_TITLE}}': answers.projectTitle,
    '{{YOUR_PROJECT_SHORT_NAME}}': answers.projectShortName,
    [PLACEHOLDERS.PROJECT_DESCRIPTION]: answers.projectDescription,
    [PLACEHOLDERS.REPOSITORY_URL]: answers.repositoryUrl,
    [PLACEHOLDERS.DATABASE_NAME]: `${projectNameSlug}-db`,
    [PLACEHOLDERS.DATABASE_NAME_DEV]: `${projectNameSlug}-dev`,
    [PLACEHOLDERS.DATABASE_NAME_TEST]: `${projectNameSlug}-test`,
    [PLACEHOLDERS.APP_TITLE]: answers.projectTitle,
    [PLACEHOLDERS.APP_SHORT_NAME]: answers.projectShortName,
    [PLACEHOLDERS.COPYRIGHT_HOLDER]: answers.copyrightHolder,
  };

  for (const file of FILES_TO_PROCESS) {
    await replaceInFile(file, replacements);
  }
}

/**
 * Generate a secure random string for NEXTAUTH_SECRET
 */
function generateNextAuthSecret() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Check if .env.local exists and create it from .env.example if needed
 */
async function setupEnvFile(answers) {
  const projectNameSlug = answers.projectName.toLowerCase().replace(/\s+/g, '-');
  const envLocalPath = '.env.local';
  
  try {
    await fs.access(envLocalPath);
    console.log('⚠️ .env.local already exists. Skipping creation.');
    return false;
  } catch (error) {
    // File doesn't exist, we'll create it
    try {
      let envExample = await fs.readFile('.env.example', 'utf8');
      
      // Generate NEXTAUTH_SECRET
      const nextAuthSecret = generateNextAuthSecret();
      
      // Replace placeholders with actual values
      envExample = envExample
        .replace('NEXT_PUBLIC_APP_NAME="{{YOUR_APP_TITLE}}"', `NEXT_PUBLIC_APP_NAME="${answers.projectTitle}"`)
        .replace('NEXT_PUBLIC_APP_SHORT_NAME="{{YOUR_APP_SHORT_NAME}}"', `NEXT_PUBLIC_APP_SHORT_NAME="${answers.projectShortName}"`)
        .replace('NEXT_PUBLIC_APP_DESCRIPTION="{{YOUR_PROJECT_DESCRIPTION}}"', `NEXT_PUBLIC_APP_DESCRIPTION="${answers.projectDescription}"`)
        .replace('NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"', `NEXTAUTH_SECRET="${nextAuthSecret}"`)
        .replace(/{{YOUR_DATABASE_NAME_DEV}}/g, `${projectNameSlug}-dev`)
        .replace(/{{YOUR_DATABASE_NAME_TEST}}/g, `${projectNameSlug}-test`);
      
      // Apply user-provided values from prompts
      if (answers.databaseUrl) {
        envExample = envExample.replace(/DATABASE_URL="postgresql:\/\/.*"/g, `DATABASE_URL="${answers.databaseUrl}"`);
      }
      
      if (answers.googleClientId) {
        envExample = envExample.replace(/GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"/g, `GOOGLE_CLIENT_ID="${answers.googleClientId}"`);
      }
      
      if (answers.googleClientSecret) {
        envExample = envExample.replace(/GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"/g, `GOOGLE_CLIENT_SECRET="${answers.googleClientSecret}"`);
      }
      
      if (answers.redisUrl) {
        envExample = envExample.replace(/REDIS_URL=""/g, `REDIS_URL="${answers.redisUrl}"`);
      }
      
      await fs.writeFile(envLocalPath, envExample, 'utf8');
      console.log(`✅ Created ${envLocalPath} with your configuration`);
      return true;
    } catch (createError) {
      console.error(`❌ Error creating ${envLocalPath}:`, createError.message);
      return false;
    }
  }
}

/**
 * Gather user inputs through prompts
 */
async function promptUserForInputs() {
  const inquirer = await getInquirer();
  
  const projectQuestions = [
    {
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?',
      validate: input => input.length > 0 || 'Project name is required',
    },
    {
      type: 'input',
      name: 'projectTitle',
      message: 'What is your project display title?',
      default: answers => answers.projectName,
    },
    {
      type: 'input',
      name: 'projectShortName',
      message: 'What is your project short name (for PWA)?',
      default: answers => answers.projectName.replace(/\s+/g, ''),
    },
    {
      type: 'input',
      name: 'projectDescription',
      message: 'Enter a brief project description:',
      default: 'A Next.js application with NextAuth.js and PostgreSQL',
    },
    {
      type: 'input',
      name: 'repositoryUrl',
      message: 'Enter your repository URL:',
      default: '',
    },
    {
      type: 'input',
      name: 'copyrightHolder',
      message: 'Enter the copyright holder name:',
      default: answers => answers.projectName,
    },
  ];

  const projectAnswers = await inquirer.default.prompt(projectQuestions);
  
  const envQuestions = [
    {
      type: 'input',
      name: 'databaseUrl',
      message: 'Enter your PostgreSQL database URL (or leave empty for default):',
      default: () => {
        const dbName = projectAnswers.projectName.toLowerCase().replace(/\s+/g, '-') + '-dev';
        return `postgresql://postgres:postgres@localhost:5432/${dbName}?schema=public`;
      },
    },
    {
      type: 'input',
      name: 'googleClientId',
      message: 'Enter your Google OAuth Client ID (or leave empty to configure later):',
      default: '',
    },
    {
      type: 'input',
      name: 'googleClientSecret',
      message: 'Enter your Google OAuth Client Secret (or leave empty to configure later):',
      default: '',
    },
    {
      type: 'input',
      name: 'redisUrl',
      message: 'Enter your Redis URL (or leave empty if not using Redis):',
      default: '',
    },
  ];
  
  const envAnswers = await inquirer.default.prompt(envQuestions);
  
  return { ...projectAnswers, ...envAnswers };
}

/**
 * Update package-lock.json by running npm install
 */
async function updateDependencies() {
  console.log('\n🔄 Updating package-lock.json...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ package-lock.json updated');
  } catch (error) {
    console.error('❌ Error updating package-lock.json:', error.message);
  }
}

/**
 * Display completion message with next steps
 */
function displayCompletionMessage(envCreated) {
  console.log('\n✨ Setup complete! Next steps:');
  console.log('1. Review the changes in your files');
  
  if (envCreated) {
    console.log('2. Review your .env.local file and update any missing credentials');
  } else {
    console.log('2. Update your .env.local file with your credentials');
  }
  
  console.log('3. Run your database migrations with: npx prisma migrate dev');
  console.log('4. Start developing with: npm run dev\n');
}

async function main() {
  console.log('🚀 Welcome to the Next.js PostgreSQL Template Setup!\n');

  // Get user inputs
  const answers = await promptUserForInputs();

  // Update project files
  console.log('\n🔄 Updating project files...');
  await updateFiles(answers);
  
  // Setup environment file
  console.log('\n🔄 Setting up environment configuration...');
  const envCreated = await setupEnvFile(answers);

  // Update dependencies
  await updateDependencies();

  // Show next steps
  displayCompletionMessage(envCreated);
}

main().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

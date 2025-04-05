#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const inquirer = require('inquirer');

// Define our placeholder tokens
const PLACEHOLDERS = {
  PROJECT_NAME: '{{YOUR_PROJECT_NAME}}',
  PROJECT_DESCRIPTION: '{{YOUR_PROJECT_DESCRIPTION}}',
  REPOSITORY_URL: '{{YOUR_REPOSITORY_URL}}',
  DATABASE_NAME: '{{YOUR_DATABASE_NAME}}',
  APP_TITLE: '{{YOUR_APP_TITLE}}',
  APP_SHORT_NAME: '{{YOUR_APP_SHORT_NAME}}',
  COPYRIGHT_HOLDER: '{{YOUR_COPYRIGHT_HOLDER}}',
};

// Files that need to be processed
const FILES_TO_PROCESS = [
  'package.json',
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
  const replacements = {
    '{{YOUR_PROJECT_NAME}}': answers.projectName.toLowerCase().replace(/\s+/g, '-'),
    '{{YOUR_PROJECT_TITLE}}': answers.projectTitle,
    '{{YOUR_PROJECT_SHORT_NAME}}': answers.projectShortName,
    [PLACEHOLDERS.PROJECT_DESCRIPTION]: answers.projectDescription,
    [PLACEHOLDERS.REPOSITORY_URL]: answers.repositoryUrl,
    [PLACEHOLDERS.DATABASE_NAME]: `${answers.projectName.toLowerCase().replace(/\s+/g, '-')}-db`,
    [PLACEHOLDERS.APP_TITLE]: answers.projectTitle,
    [PLACEHOLDERS.APP_SHORT_NAME]: answers.projectShortName,
    [PLACEHOLDERS.COPYRIGHT_HOLDER]: answers.copyrightHolder,
  };

  for (const file of FILES_TO_PROCESS) {
    await replaceInFile(file, replacements);
  }
}

/**
 * Gather user inputs through prompts
 */
async function promptUserForInputs() {
  return inquirer.prompt([
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
      default: answers => answers.projectName.toLowerCase().replace(/\s+/g, ''),
    },
    {
      type: 'input',
      name: 'projectDescription',
      message: 'Enter a brief project description:',
      default: 'A Next.js application with Firebase Auth and PostgreSQL',
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
  ]);
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
function displayCompletionMessage() {
  console.log('\n✨ Setup complete! Next steps:');
  console.log('1. Review the changes in your files');
  console.log('2. Update your .env file with your credentials');
  console.log("3. Run npm install if you haven't already");
  console.log('4. Start developing with npm run dev\n');
}

async function main() {
  console.log('🚀 Welcome to the Next.js Firebase PostgreSQL Template Setup!\n');

  // Get user inputs
  const answers = await promptUserForInputs();

  // Update project files
  console.log('\n🔄 Updating project files...');
  await updateFiles(answers);

  // Update dependencies
  await updateDependencies();

  // Show next steps
  displayCompletionMessage();
}

main().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

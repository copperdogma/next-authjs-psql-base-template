# Setting Up Your Project

This template provides a starting point for building a Next.js application with Firebase Authentication and PostgreSQL. Follow these steps to get started with your new project.

## Quick Start

1. Create a new repository using this template
2. Clone your new repository
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the setup script:
   ```bash
   npm run setup
   ```
   This will prompt you for:
   - Project name
   - Project display title
   - Project short name (for PWA)
   - Project description
   - Repository URL
   - Copyright holder name

## Manual Setup

If you prefer to set up manually, you'll need to replace the following placeholders throughout the codebase:

### Required Placeholders

- `{{YOUR_PROJECT_NAME}}` - Your project's name (used in package.json, etc.)
- `{{YOUR_PROJECT_DESCRIPTION}}` - A brief description of your project
- `{{YOUR_REPOSITORY_URL}}` - Your Git repository URL
- `{{YOUR_DATABASE_NAME}}` - Your database name
- `{{YOUR_APP_TITLE}}` - The display title for your application
- `{{YOUR_APP_SHORT_NAME}}` - A short name for PWA
- `{{YOUR_COPYRIGHT_HOLDER}}` - Copyright holder's name

### Files to Update

The following files need to be updated with your project's information:

1. `package.json`
   - name
   - description
   - repository url

2. `.env.example` and `.env`
   - Database URLs
   - App name

3. `app/manifest.ts`
   - PWA name and short name
   - Description

4. `app/layout.tsx`
   - Page title
   - Meta description

5. Documentation files in `/docs`
   - Update project-specific content

## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the following environment variables:
   - Firebase configuration
   - Database URLs
   - API keys and secrets

## Next Steps

1. Update the README.md with your project's specific information
2. Set up your database
3. Configure Firebase Authentication
4. Start the development server:
   ```bash
   npm run dev
   ```

## Troubleshooting

If you encounter any issues during setup:

1. Make sure all dependencies are installed
2. Check that all environment variables are properly set
3. Verify that Firebase and PostgreSQL are properly configured
4. Run `npm run validate` to check for any code issues

For more detailed information about the template structure and features, refer to the README.md file. 
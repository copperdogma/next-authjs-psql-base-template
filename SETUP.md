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
- `{{YOUR_COPYRIGHT_HOLDER}}` - Copyright holder's name

### Files to Update

The following files need to be updated with your project's information:

1. `package.json`

   - name
   - description
   - repository url

2. `.env.example` and `.env`

   - Database URLs

3. `app/layout.tsx`

   - Page title
   - Meta description

4. Documentation files in `/docs`
   - Update project-specific content

## Environment Setup

1. Copy `.env.example`

# Project Setup Guide

This guide helps you initialize your new project based on this template. The template uses Next.js, NextAuth.js (with PostgreSQL via Prisma Adapter), and PostgreSQL for the database.

## Recommended: Automated Setup Script

The easiest way to get started is to use the automated setup script:

1.  **Clone Your Repository**:
    If you haven't already, clone the repository you created from this template.

    ```bash
    # Replace with your repository URL
    git clone https://github.com/yourusername/your-new-project.git
    cd your-new-project
    ```

2.  **Install Dependencies**:

    ```bash
    npm install
    ```

3.  **Run the Setup Script**:

    ```bash
    node scripts/setup.js
    ```

    This interactive script will guide you through:

    > **Note:** This script uses interactive prompts. If you are running this in a non-interactive environment, you may need to modify the script to use hardcoded values or environment variables for configuration, or alternatively, follow the manual configuration steps.

    - Replacing project placeholders (name, description, title, repository URL, copyright holder).
    - Configuring essential environment variables by creating a `.env.local` file. This includes:
      - `DATABASE_URL` for PostgreSQL.
      - Auto-generating a secure `NEXTAUTH_SECRET`.
      - Prompting for `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (if using Google Sign-In).
      - Optionally configuring `REDIS_URL`.

4.  **Database Migration**:
    After the setup script completes and your `.env.local` is configured, run database migrations:

    > **Prerequisites:** Ensure your PostgreSQL server is running and the database user specified in `DATABASE_URL` has `CREATEDB` permission. You might need to grant this permission using a command like `ALTER USER "yourusername" CREATEDB;` executed by a PostgreSQL superuser. Replace `yourusername` with the actual username from your `DATABASE_URL`.
    > If your username or database name in `DATABASE_URL` are SQL reserved keywords, they might need to be quoted if you are manually creating the user or database.

    > **Note:** Ensure your `DATABASE_URL` from `.env.local` is available to Prisma. You can prefix the command with `npx dotenv-cli -e .env.local` if needed (install `dotenv-cli` via `npm install -g dotenv-cli` or as a dev dependency).

    ```bash
    npx dotenv-cli -e .env.local npx prisma migrate dev
    ```

    This will create the necessary tables in your PostgreSQL database based on `prisma/schema.prisma`.

5.  **Start Development Server**:

    ```bash
    npm run dev
    ```

    Your application should now be running, typically at `http://localhost:3000` (or the URL specified in `NEXTAUTH_URL`).

    > **Note:** After running `npm run dev`, please manually open your browser and navigate to `http://localhost:3000` (or the URL specified in `NEXTAUTH_URL` in your `.env.local` file) to verify the application is running. In some automated environments, direct verification of this step can be challenging.

## Manual Configuration (Alternative)

If you choose not to use `npm run setup` or need to make manual adjustments:

1.  **Install Dependencies**: `npm install`

2.  **Environment Variables (`.env.local`)**:

    - Copy `.env.example` to `.env.local`: `cp .env.example .env.local`
    - Manually edit `.env.local` and provide values for:
      - `DATABASE_URL`: Your PostgreSQL connection string.
      - `NEXTAUTH_SECRET`: Generate one with `openssl rand -base64 32`.
      - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: If using Google Sign-In.
      - `NEXTAUTH_URL`: The base URL of your application (e.g., `http://localhost:3000`).
      - `REDIS_URL`: (Optional) If using Redis.

3.  **Placeholder Replacement**:
    Manually search and replace the following placeholders in files like `package.json`, `README.md`, `LICENSE`, and within code comments/documentation:

    - `{{YOUR_PROJECT_NAME}}`
    - `{{YOUR_PROJECT_DESCRIPTION}}`
    - `{{YOUR_REPOSITORY_URL}}`
    - `{{YOUR_APP_TITLE}}`
    - `{{YOUR_COPYRIGHT_HOLDER}}`
    - Database name placeholders (e.g., `{{YOUR_DATABASE_NAME_DEV}}`, `{{YOUR_DATABASE_NAME_TEST}}`) if not handled by `.env.local`.
    - If constructing `DATABASE_URL` manually with such placeholders, note that if your username or database name are SQL reserved keywords, they might need to be quoted.

4.  **Database Migration**:

    > **Prerequisites:** Ensure your PostgreSQL server is running and the database user specified in `DATABASE_URL` has `CREATEDB` permission. You might need to grant this permission using a command like `ALTER USER "yourusername" CREATEDB;` executed by a PostgreSQL superuser. Replace `yourusername` with the actual username from your `DATABASE_URL`.
    > If your username or database name in `DATABASE_URL` are SQL reserved keywords, they might need to be quoted if you are manually creating the user or database.

    > **Note:** Ensure your `DATABASE_URL` from `.env.local` is available to Prisma. You can prefix the command with `npx dotenv-cli -e .env.local` if needed (install `dotenv-cli` via `npm install -g dotenv-cli` or as a dev dependency).

    ```bash
    npx dotenv-cli -e .env.local npx prisma migrate dev
    ```

5.  **Start Development Server**:
    After manual setup and migration:
    ```bash
    npm run dev
    ```
    > **Note:** After running `npm run dev`, please manually open your browser and navigate to `http://localhost:3000` (or the URL specified in `NEXTAUTH_URL` in your `.env.local` file) to verify the application is running. In some automated environments, direct verification of this step can be challenging.

## Authentication (NextAuth.js with PostgreSQL)

- Core authentication relies on NextAuth.js using the Prisma Adapter with your PostgreSQL database.
- Supported providers (Google, Credentials) are configured in `lib/auth-shared.ts`.
- Ensure `DATABASE_URL` and `NEXTAUTH_SECRET` are correctly set in `.env.local`.

## Optional Firebase Services

- This template does **not** use Firebase for core authentication.
- If you plan to integrate other Firebase services (e.g., Firestore, Storage, Firebase Functions):
  1.  Set up a Firebase project in the Firebase Console.
  2.  Add your Firebase client configuration variables to `.env.local`.
  3.  The route `app/api/test/firebase-config/route.ts` can provide client-side Firebase config. For security, it requires `ALLOW_FIREBASE_CONFIG_ENDPOINT=true` in `.env.local` to be active (intended for development/testing).

## Next Steps

- Explore the `components/` and `app/` directories to understand the structure.
- Customize UI components in `components/ui/`.
- Add new routes and features as needed.
- Refer to `README.md` for available commands and further project details.

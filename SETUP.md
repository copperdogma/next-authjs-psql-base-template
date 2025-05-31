# Project Setup Guide

This guide helps you initialize your new project based on this template. The template uses Next.js, NextAuth.js (with PostgreSQL via Prisma Adapter), and PostgreSQL for the database.

## Recommended: Automated Setup Script

The easiest way to get started is to use the automated setup script:

1.  **Clone Your Repository**:
    If you haven't already, clone the repository you created from this template.

    ```bash
    mkdir https://github.com/copperdogma/next-authjs-psql-base-template
    cd https://github.com/copperdogma/next-authjs-psql-base-template
    git clone https://github.com/copperdogma/next-authjs-psql-base-template .
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

    > **Note:** This script uses interactive prompts. If you are running this in a non-interactive environment (e.g., when an AI agent is performing the setup), please refer to the "Non-Interactive Setup" section below.

    - Replacing project placeholders (name, description, title, repository URL, copyright holder).
    - Configuring essential environment variables by creating a `.env.local` file. This includes:
      - `DATABASE_URL` for PostgreSQL.
      - Auto-generating a secure `NEXTAUTH_SECRET`.
      - Prompting for `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (if using Google Sign-In).
      - Optionally configuring `REDIS_URL`.

4.  **Database Migration**:
    After the setup script completes and your `.env.local` is configured, run database migrations:

    > **Prerequisites:**
    >
    > 1.  Ensure your PostgreSQL **server** is running and accessible at the host and port specified in the `DATABASE_URL` within your `.env.local` file (e.g., `localhost:5432` or `127.0.0.1:5432`).
    > 2.  The `DATABASE_URL` must contain valid credentials (user and password) for your PostgreSQL server.
    > 3.  **Database Creation:** `prisma migrate dev` **will attempt to create the database** (e.g., `your_dev_db_name` from your configuration) if it does not already exist on the server.
    > 4.  For this automatic database creation to succeed, the PostgreSQL user specified in `DATABASE_URL` (e.g., `postgres`) must have the necessary privileges on the PostgreSQL _server_ to create new databases. This often means the user is a superuser or has the `CREATEDB` server-level role attribute. (e.g., `ALTER USER yourusername CREATEDB;` run by a superuser on the PostgreSQL server).
    >
    > **AI Agents & Local Development:** For fresh local PostgreSQL installations, using default superuser credentials like `postgres:postgres` in your `DATABASE_URL` (e.g., `postgresql://postgres:postgres@127.0.0.1:5432/your_new_db_name?schema=public`) is often a good starting point, as this user typically has database creation rights. If you encounter database connection errors (like Prisma error P1001) with `localhost`, try using `127.0.0.1` as the host in your `DATABASE_URL`.

    > **Note on `dotenv-cli`:** The command below uses `dotenv-cli` to ensure environment variables from `.env.local` are loaded. It's recommended to have `dotenv-cli` as a development dependency in your `package.json` (`npm install --save-dev dotenv-cli`). If it's listed there, `npx` will use the local version.

    ```bash
    npx dotenv-cli -e .env.local npx prisma migrate dev
    ```

    This will create the necessary tables in your PostgreSQL database based on `prisma/schema.prisma`.

5.  **Start Development Server**:

    - **For manual development:**

      ```bash
      npm run dev
      ```

      Your application should now be running, typically at `http://localhost:3000` (or the URL specified in `NEXTAUTH_URL`).

    - **For AI Agents and Automated Environments:**
      Do **not** use `npm run dev` as it is interactive. Instead, use a background process manager like PM2, which is pre-configured in this project.
      ```bash
      npm run ai:start
      ```
      This command will start the server in the background. You can check its status with `npm run ai:status` and view logs with `npm run ai:logs`. Refer to the "AI Agent Server Management (PM2)" section in your project's command reference (often found in `README.md` or a similar documentation file) for more details.

    > **Note:** After starting the server (manually or via AI agent commands), please manually open your browser and navigate to `http://localhost:3000` (or the URL specified in `NEXTAUTH_URL` in your `.env.local` file) to verify the application is running. In some automated environments, direct verification of this step can be challenging.

## Non-Interactive Setup (for AI Agents and Automated Environments)

For environments where interactive prompts are not suitable, such as when an AI agent is setting up the project or in automated CI/CD pipelines, the `scripts/setup.js` script can be used with a JSON configuration file.

**1. Prepare a Configuration File:**

Create a JSON file (e.g., `setup-answers.json`) that provides the answers to the setup prompts. The structure of this file should be as follows:

```json
{
  "YOUR_PROJECT_NAME": "your-project-name",
  "YOUR_PROJECT_DESCRIPTION": "Your project description.",
  "YOUR_COPYRIGHT_HOLDER": "Your Name or Company",
  "YOUR_PROJECT_URL": "https://your-project.example.com",
  "YOUR_REPOSITORY_URL": "https://github.com/your-username/your-project-name",
  "YOUR_AUTHOR_NAME": "Your Name",
  "YOUR_AUTHOR_EMAIL": "you@example.com",
  "YOUR_APP_TITLE": "Your App Title",
  "YOUR_APP_SHORT_NAME": "YourApp",
  "YOUR_APP_NAME": "Your Application Name",
  "YOUR_APP_DESCRIPTION": "A description for your application.",
  "YOUR_DATABASE_NAME_DEV": "your_dev_db_name",
  "YOUR_DATABASE_NAME_TEST": "your_test_db_name",
  "YOUR_DATABASE_NAME": "your_main_db_name",
  "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/your_dev_db_name?schema=public",
  "GOOGLE_CLIENT_ID": "", // Optional: leave empty if not using Google Sign-In
  "GOOGLE_CLIENT_SECRET": "", // Optional: leave empty if not using Google Sign-In
  "REDIS_URL": "", // Optional: leave empty if not using Redis
  "overwriteEnv": false // AI Agents: Set to true if you need to force regeneration of .env.local
}
```

> **Note:** It's recommended to include a `setup-answers.example.json` in the repository root for users and AI agents to use as a template. All keys shown above should be present in your `setup-answers.json` file, even if some values (like Google or Redis credentials) are left empty if not used. The `DATABASE_URL` provided here will be used to create the `.env.local` file; ensure it points to an accessible PostgreSQL server and uses credentials with rights to create the specified database if it doesn't exist.
> **AI Agents:** If `localhost` in `DATABASE_URL` causes connection issues (e.g., Prisma error P1001), try using `127.0.0.1` instead. The `scripts/setup.js` script will use the `DATABASE_URL` from this config file to populate `.env.local`. If you need to regenerate `.env.local` based on this file, ensure `overwriteEnv` is set to `true` in your `setup-answers.json`.
> **Important for Google Sign-In:** If you plan to use Google Sign-In, the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your `setup-answers.json` (and subsequently in `.env.local`) must be populated with valid credentials from the [Google Cloud Console](https://console.cloud.google.com/).
> If you are an AI agent performing the setup and these were left blank in `setup-answers.json`, please instruct the user to:
>
> 1. Obtain their Google OAuth 2.0 Client ID and Secret from the Google Cloud Console.
> 2. Ensure their OAuth consent screen is configured and the application is authorized for `http://localhost:3000` (or the relevant `NEXTAUTH_URL`) as both an authorized JavaScript origin and an authorized redirect URI (typically `[YOUR_APP_URL]/api/auth/callback/google`).
> 3. Manually add these credentials to the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` variables in the `.env.local` file.
> 4. Restart the development server (e.g., using `npm run ai:restart` if managed by PM2) for the changes to take effect.

**2. Run the Setup Script with Configuration:**

Execute the setup script by providing the path to your JSON configuration file using a command-line argument (e.g., `--config`).

```bash
node scripts/setup.js --config path/to/your-setup-answers.json
```

> **Important:** This assumes that `scripts/setup.js` has been designed or modified to accept a `--config` (or similar) command-line argument to parse the JSON file and use its values instead of prompting interactively. If the script does not currently support this, it will need to be updated accordingly.

After the script completes, continue with the database migration and other steps as outlined below.

**3. Database Migration (AI Agents):**
Follow the same database migration steps as in the "Automated Setup Script" section (Step 4), ensuring your `DATABASE_URL` (likely in `.env.local` via `setup-answers.json`) is correct and the PostgreSQL server is accessible.

```bash
npx dotenv-cli -e .env.local npx prisma migrate dev
```

**4. Start Development Server (AI Agents):**
Do **not** use `npm run dev`. Instead, start the server using the PM2-managed scripts:

```bash
npm run ai:start
```

Verify server status with `npm run ai:status` and check logs with `npm run ai:logs`. Refer to the "AI Agent Server Management (PM2)" section in your project's command reference.

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

    - `next-authjs-psql-base-template-TEST9`
    - `A Next.js project with NextAuth.js and PostgreSQL.`
    - `https://github.com/user/project-repo`
    - `My Next App`
    - `AI Agent`
    - Database name placeholders (e.g., `next_auth_dev`, `next_auth_test`) if not handled by `.env.local`.
    - If constructing `DATABASE_URL` manually with such placeholders, note that if your username or database name are SQL reserved keywords, they might need to be quoted.

4.  **Database Migration**:

    > **Prerequisites:**
    >
    > 1.  Ensure your PostgreSQL **server** is running and accessible at the host and port specified in the `DATABASE_URL` within your `.env.local` file. If `localhost` causes issues, try `127.0.0.1`.
    > 2.  The `DATABASE_URL` must contain valid credentials for your PostgreSQL server.
    > 3.  **Database Creation:** `prisma migrate dev` **will attempt to create the database** if it does not already exist.
    > 4.  For this automatic database creation to succeed, the PostgreSQL user specified in `DATABASE_URL` must have the necessary privileges on the PostgreSQL _server_ to create new databases (superuser or `CREATEDB` server-level attribute).
    >
    > **AI Agents & Local Development:** For fresh local PostgreSQL installations, using default superuser credentials like `postgres:postgres` in your `DATABASE_URL` (e.g. `postgresql://postgres:postgres@127.0.0.1:5432/your_db_name?schema=public`) is often a good starting point.

    > **Note on `dotenv-cli`:** The command below uses `dotenv-cli`. It's recommended to have `dotenv-cli` as a development dependency (`npm install --save-dev dotenv-cli`).

    ```bash
    npx dotenv-cli -e .env.local npx prisma migrate dev
    ```

5.  **Start Development Server**:
    After manual setup and migration:

    - **For manual development:**
      ```bash
      npm run dev
      ```
    - **For AI Agents and Automated Environments:**
      Do **not** use `npm run dev`. Instead, use:
      ```bash
      npm run ai:start
      ```
      Check status and logs with `npm run ai:status` and `npm run ai:logs`.

    > **Note:** After running `npm run dev` (or `npm run ai:start`), please manually open your browser and navigate to `http://localhost:3000` (or the URL specified in `NEXTAUTH_URL` in your `.env.local` file) to verify the application is running. In some automated environments, direct verification of this step can be challenging.

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

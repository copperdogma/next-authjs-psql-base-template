console.log('--- Loading tests/e2e/global-setup.ts ---'); // Add top-level log

import path from 'path';
import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Setup required environment variables for testing
require('dotenv').config({ path: '.env.test' });

// Test user constants and setup
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test123!';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000'; // Fixed ID for predictability
const STORAGE_STATE = path.join(__dirname, '..', '.auth', 'user.json');

// Initialize Prisma client
const prisma = new PrismaClient();

async function globalSetup(_config: FullConfig): Promise<void> {
  // Implementation - keep actual implementation
  console.log('Starting global setup...');
  // Create test user directly in the database
  try {
    const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 10);

    // Create or update test user with a fixed ID for predictability
    await prisma.user.upsert({
      where: { email: TEST_USER_EMAIL },
      update: {
        id: TEST_USER_ID,
        name: 'Test User',
        hashedPassword: hashedPassword,
        emailVerified: new Date(),
        role: UserRole.USER,
      },
      create: {
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        name: 'Test User',
        hashedPassword: hashedPassword,
        emailVerified: new Date(),
        role: UserRole.USER,
      },
    });

    console.log(`Test user created/updated with email: ${TEST_USER_EMAIL}`);

    // Setup browser for authenticated tests
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Go to login page and perform login
    await page.goto('http://localhost:3777/login'); // Use the actual test server port 3777

    // Take a screenshot to debug
    await page.screenshot({ path: 'login-page-debug.png' });
    console.log('Screenshot saved to login-page-debug.png');

    // Try to identify form elements
    const emailInputs = await page.$$('input[type="email"], input#email');
    const passwordInputs = await page.$$('input[type="password"], input#password');
    const submitButtons = await page.$$('button[type="submit"]');

    console.log(
      `Found ${emailInputs.length} email inputs, ${passwordInputs.length} password inputs, ${submitButtons.length} submit buttons`
    );

    // Just try a different approach - use form selector directly
    if (emailInputs.length > 0 && passwordInputs.length > 0 && submitButtons.length > 0) {
      console.log('Form elements found, proceeding with login');

      // Fill the first email input
      await emailInputs[0].fill(TEST_USER_EMAIL);
      console.log('Email filled');

      // Fill the first password input
      await passwordInputs[0].fill(TEST_USER_PASSWORD);
      console.log('Password filled');

      // Click the first submit button
      await submitButtons[0].click();
      console.log('Submit button clicked');

      // Wait for login to complete and redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('Redirected to dashboard');

      // Save storage state
      await page.context().storageState({ path: STORAGE_STATE });
      console.log(`Authentication state saved to: ${STORAGE_STATE}`);
    } else {
      throw new Error('Login form elements not found on page');
    }

    await browser.close();
    await prisma.$disconnect();
  } catch (error) {
    console.error('Global setup failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

export default globalSetup;

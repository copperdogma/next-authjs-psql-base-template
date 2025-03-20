// Simple test script that only checks the basic layout elements
const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  console.log('Starting simple layout test');
  
  try {
    // Launch a browser manually
    console.log('Launching browser...');
    const browser = await chromium.launch({ 
      headless: false, // Run headed for visibility
      timeout: 30000   // 30 second timeout
    });
    
    // Create a new context
    console.log('Creating browser context...');
    const context = await browser.newContext();
    
    // Create a new page
    console.log('Creating new page...');
    const page = await context.newPage();
    
    // Navigate to the page
    console.log('Navigating to the app...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Log the current URL
    console.log('Current URL:', page.url());
    
    // Wait a bit longer for the page to be completely ready
    console.log('Waiting for additional hydration...');
    await page.waitForTimeout(2000);

    // Take a screenshot for debugging - save to gitignored screenshots directory
    await page.screenshot({ path: 'tests/e2e/screenshots/layout-screenshot.png' });
    console.log('Screenshot saved to tests/e2e/screenshots/layout-screenshot.png');
    
    // Save the complete HTML for inspection
    const htmlContent = await page.content();
    fs.writeFileSync('page-content.html', htmlContent);
    console.log('Complete HTML saved to page-content.html');
    
    // Check for ANY element that might be from our BaseLayout
    console.log('\nChecking for any navigation elements:');
    const navElement = await page.$('nav');
    console.log(`Nav element found: ${!!navElement}`);
    
    const mainElement = await page.$('main');
    console.log(`Main element found: ${!!mainElement}`);
    
    const footerElement = await page.$('footer');
    console.log(`Footer element found: ${!!footerElement}`);
    
    const headerElement = await page.$('header');
    console.log(`Header element found: ${!!headerElement}`);
    
    // Try to find any elements with role attributes
    console.log('\nChecking for elements with role attributes:');
    const bannerElement = await page.$('[role="banner"]');
    console.log(`Banner role found: ${!!bannerElement}`);
    
    const navigationElement = await page.$('[role="navigation"]');
    console.log(`Navigation role found: ${!!navigationElement}`);
    
    const mainRoleElement = await page.$('[role="main"]');
    console.log(`Main role found: ${!!mainRoleElement}`);
    
    const contentInfoElement = await page.$('[role="contentinfo"]');
    console.log(`Contentinfo role found: ${!!contentInfoElement}`);
    
    // Try to find any recognizable content
    console.log('\nChecking for recognizable content:');
    
    // App name from environment or default
    const appName = process.env.NEXT_PUBLIC_APP_NAME || '{{YOUR_APP_NAME}}';
    const hasAppName = await page.evaluate((name) => {
      return document.body.textContent.includes(name);
    }, appName);
    console.log(`App name "${appName}" found in page: ${hasAppName}`);
    
    // Current year in copyright notice
    const currentYear = new Date().getFullYear().toString();
    const hasYear = await page.evaluate((year) => {
      return document.body.textContent.includes(year);
    }, currentYear);
    console.log(`Current year "${currentYear}" found in page: ${hasYear}`);
    
    // Home link
    const hasHomeLink = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a')).some(a => 
        a.textContent.trim() === 'Home' || a.href.endsWith('/'));
    });
    console.log(`Home link found in page: ${hasHomeLink}`);
    
    // Clean up
    console.log('\nCleaning up...');
    await context.close();
    await browser.close();
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})(); 
# PWA Installation Testing and Validation Guide

This guide explains how to test and validate the basic Progressive Web App (PWA) installation capabilities provided by this template via the native Next.js manifest.

## Prerequisites

1. Ensure the project is running (e.g., `npm run dev` or `npm run start`).
2. Verify that the icons referenced in `app/manifest.ts` (e.g., `public/icon-192x192.png`, `public/icon-512x512.png`) exist and are the desired icons for your application.

## Testing PWA Installation

### Desktop

1. Open Chrome or Edge browser.
2. Navigate to your application (e.g., http://localhost:3000).
3. Look for the install icon in the address bar (may look like a monitor with a downward arrow).
4. Click the install icon and follow the prompts.
5. The app should install and open in a separate window, using the icons defined in the manifest.

### Mobile

1. Open Chrome on Android or Safari on iOS.
2. Navigate to your application.
3. For Android:
   - Look for an "Add to Home Screen" prompt or select "Install app" from the browser menu.
4. For iOS:
   - Tap the Share button.
   - Scroll down and select "Add to Home Screen".
5. The app should appear on your home screen with the proper icon from the manifest.

## Running Lighthouse Audit

While this template doesn't include a service worker for offline support by default, you can still run a Lighthouse audit to check the manifest and other PWA-related aspects.

1. Open Chrome DevTools (F12 or right-click > Inspect).
2. Navigate to the Lighthouse tab.
3. Select "Progressive Web App" category (and any others you wish to audit).
4. Click "Analyze page load".
5. Review the results. Focus on the manifest-related checks.

### Key Lighthouse PWA Checks (Relevant to this template)

- [ ] Has a `<meta name="viewport">` tag with width or initial-scale
- [ ] Web app manifest meets the installability requirements
- [ ] Manifest has proper icons (check size and format requirements)
- [ ] Is configured for a custom splash screen (via manifest)
- [ ] Sets a theme color for the address bar (via manifest)
- [ ] Redirects HTTP traffic to HTTPS (Essential for PWA install prompts in production)

_(Note: Checks related to service worker registration and offline response will likely fail, as this functionality is not included by default.)_

## Common Issues

1. **PWA not installable:**
   - Verify `app/manifest.ts` is correctly configured and syntactically valid.
   - Ensure the icon files referenced in the manifest exist in the `public/` directory and are accessible.
   - Check that the app is served over HTTPS (required for installation prompts in most production environments).
   - Review Lighthouse audit results for specific manifest errors.

## Notes for Developers

- This template provides basic PWA installability via the native Next.js manifest.
- **Offline Support:** If you require offline functionality, you will need to implement a service worker. Consider libraries like `Serwist` ([see Next.js docs](https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps#offline-support)).
- **Advanced Features:** Push notifications, background sync, etc., also require a service worker implementation.
- Always test the PWA installation on both desktop and mobile devices.

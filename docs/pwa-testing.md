# PWA Testing and Validation Guide

This guide explains how to test and validate your Progressive Web App (PWA) implementation in this template.

## Prerequisites

1. Build the project for production:

   ```bash
   npm run build
   npm run start
   ```

2. For PNG icons (recommended for production):
   - Convert the SVG icons to PNG format
   - You can use online converters or ImageMagick:
     ```bash
     # If you have ImageMagick installed
     convert public/icon-192x192.svg public/icon-192x192.png
     convert public/icon-512x512.svg public/icon-512x512.png
     ```
   - Update `app/manifest.ts` and `app/layout.tsx` to use PNG files instead of SVG

## Testing PWA Installation

### Desktop

1. Open Chrome or Edge browser
2. Navigate to your application (e.g., http://localhost:3000)
3. Look for the install icon in the address bar
4. Click the install icon and follow the prompts
5. The app should install and open in a separate window

### Mobile

1. Open Chrome on Android or Safari on iOS
2. Navigate to your application
3. For Android:
   - Look for the "Add to Home Screen" prompt or select "Install app" from the menu
4. For iOS:
   - Tap the Share button
   - Scroll down and select "Add to Home Screen"
5. The app should appear on your home screen with the proper icon

## Testing Offline Functionality

1. Install and open the app
2. Navigate to a few pages to cache them
3. Enable airplane mode or disconnect from the internet
4. Try to navigate to the cached pages - they should work
5. Try to navigate to uncached pages - you should see the offline fallback page

## Running Lighthouse Audit

1. Open Chrome DevTools (F12 or right-click > Inspect)
2. Navigate to the Lighthouse tab
3. Select "Progressive Web App" category
4. Click "Analyze page load"
5. Review the results - aim for a high PWA score

### Key Lighthouse PWA Checks

- [x] Has a `<meta name="viewport">` tag with width or initial-scale
- [x] Registers a service worker
- [x] Responds with a 200 when offline
- [x] Web app manifest meets the installability requirements
- [x] Manifest has proper icons
- [x] Redirects HTTP traffic to HTTPS
- [x] Is configured for a custom splash screen
- [x] Sets a theme color for the address bar

## Common Issues

1. **Service worker not registering:**

   - Make sure you're running in production mode
   - Check browser console for errors

2. **PWA not installable:**

   - Verify manifest.ts is properly configured
   - Ensure required icons are available
   - Check that the app is served over HTTPS (required for production)

3. **Offline functionality not working:**
   - Check that service worker is registered
   - Make sure you've visited pages to cache them
   - Verify offline.tsx page is properly implemented

## Notes for Developers

- For template users: Replace the placeholder SVG/PNG icons with your own app icons before deployment
- Consider adding advanced features like push notifications, background sync, etc. as your app matures
- Always test the PWA installation on both desktop and mobile devices before deployment

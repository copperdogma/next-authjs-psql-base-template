// Configure React for testing
require('@testing-library/jest-dom');

// Import constants - we have to require instead of import due to CommonJS
const { FIREBASE_TEST_CONFIG } = require('../../utils/test-constants');

// Set Firebase environment variables from constants
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = FIREBASE_TEST_CONFIG.API_KEY;
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = FIREBASE_TEST_CONFIG.AUTH_DOMAIN;
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = FIREBASE_TEST_CONFIG.PROJECT_ID;
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = FIREBASE_TEST_CONFIG.STORAGE_BUCKET;
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = FIREBASE_TEST_CONFIG.MESSAGING_SENDER_ID;
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = FIREBASE_TEST_CONFIG.APP_ID;

// Configure Jest environment
global.React = require('react');

// Mock matchMedia for responsive design testing
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

// Mock Tailwind CSS classes
// This allows Jest to recognize classes like 'hidden' for visibility testing
document.documentElement.classList.add('js-test-env');

// Override the getComputedStyle method to handle Tailwind's 'hidden' class
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = function (element) {
  const computedStyle = originalGetComputedStyle(element);

  // Special handling for the 'hidden' class
  if (element.classList && element.classList.contains('hidden')) {
    const styleOverrides = {
      display: 'none',
      getPropertyValue: function (prop) {
        return prop === 'display' ? 'none' : computedStyle.getPropertyValue(prop);
      },
    };

    return Object.assign({}, computedStyle, styleOverrides);
  }

  return computedStyle;
};

// Add mock for fetch required by NextAuth
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
  })
);

// Set NextAuth environment variables
const TEST_PORT = process.env.TEST_PORT || '3000';
const APP_URL = `http://localhost:${TEST_PORT}`;
process.env.NEXTAUTH_URL = APP_URL;
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

// Add any additional global test setup here

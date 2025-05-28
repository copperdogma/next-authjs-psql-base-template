// Configure React for testing
require('@testing-library/jest-dom');

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

// Add any additional global test setup here

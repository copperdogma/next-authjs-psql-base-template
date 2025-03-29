/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    // Tailwind CSS with PostCSS
    '@tailwindcss/postcss': {},

    // Nesting support
    'postcss-nesting': {},

    // CSS minification in production
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
};

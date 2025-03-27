/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    'postcss-import': {},

    // Tailwind CSS
    tailwindcss: {},

    // Nesting support
    'postcss-nesting': {},

    // Autoprefixer
    autoprefixer: {},

    // CSS minification in production
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
};

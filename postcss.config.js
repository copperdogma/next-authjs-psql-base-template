/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    // Process @import rules first
    'postcss-import': {},
    // Use Tailwind's built-in nesting plugin (must come before tailwindcss)
    'tailwindcss/nesting': {},
    // Process Tailwind directives
    tailwindcss: {},
    // Add vendor prefixes for browser compatibility
    autoprefixer: {},
    // Add cssnano for production builds only
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: {
            preset: 'default',
          },
        }
      : {}),
  },
};

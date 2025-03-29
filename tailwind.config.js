/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        'muted-foreground': 'var(--color-muted-foreground)',
        accent: 'var(--color-accent)',
        'accent-foreground': 'var(--color-accent-foreground)',
        primary: {
          DEFAULT: '#0fa9e6',
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      typography: theme => ({
        DEFAULT: {
          css: {
            color: 'var(--color-foreground)',
            a: {
              color: 'var(--color-primary-500)',
              '&:hover': {
                color: 'var(--color-primary-600)',
              },
            },
            h1: {
              color: 'var(--color-foreground)',
            },
            h2: {
              color: 'var(--color-foreground)',
            },
            h3: {
              color: 'var(--color-foreground)',
            },
            h4: {
              color: 'var(--color-foreground)',
            },
            h5: {
              color: 'var(--color-foreground)',
            },
            h6: {
              color: 'var(--color-foreground)',
            },
          },
        },
        dark: {
          css: {
            color: 'var(--color-foreground)',
            a: {
              color: 'var(--color-primary-400)',
              '&:hover': {
                color: 'var(--color-primary-300)',
              },
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class',
};

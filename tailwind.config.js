/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Per-project accent; the CSS var is set on :root by useAccentColor.
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          soft: 'rgb(var(--accent-rgb) / 0.12)',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b1b9c9',
          400: '#8792a9',
          500: '#68738d',
          600: '#525b73',
          700: '#434a5e',
          800: '#3a404f',
          900: '#181b23',
          950: '#101218',
        },
      },
      fontFamily: {
        sans: [
          'Inter var',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgb(16 18 24 / 0.04), 0 4px 16px -4px rgb(16 18 24 / 0.08)',
        lift: '0 2px 4px rgb(16 18 24 / 0.06), 0 12px 32px -8px rgb(16 18 24 / 0.16)',
      },
      keyframes: {
        'sync-pulse': {
          '0%': { backgroundColor: 'rgb(var(--accent-rgb) / 0.18)' },
          '100%': { backgroundColor: 'transparent' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'sync-pulse': 'sync-pulse 1.6s ease-out forwards',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}

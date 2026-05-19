/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f6b26b', // Wowoo warm orange
          600: '#ea580c',
          700: '#c2410c',
        },
        creation: {
          bg: '#dae8fc',
          text: '#3170b3',
        },
        idea: {
          bg: '#d5e8d4',
          text: '#448746',
        },
        stuff: {
          bg: '#e1d5e7',
          text: '#7f4a88',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'wowoo': '0 2px 8px rgba(0,0,0,0.08)',
        'wowoo-lg': '0 4px 16px rgba(0,0,0,0.12)',
      }
    },
  },
  plugins: [],
}
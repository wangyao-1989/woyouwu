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
          50: '#fff8f0',
          100: '#ffe8d0',
          200: '#ffd4a0',
          300: '#ffba6b',
          400: '#ff9f43',
          500: '#f6b26b', // Wowoo warm orange
          600: '#e8955d',
          700: '#c97a4a',
        },
        creation: {
          bg: '#e8f4fc',
          text: '#2d6fa3',
        },
        idea: {
          bg: '#e0f2e0',
          text: '#3d7a40',
        },
        stuff: {
          bg: '#f0e6f2',
          text: '#704a80',
        },
        hand: {
          bg: '#fffef7',
          paper: '#fdfbf5',
          ink: '#2d2d2d',
          pencil: '#8b7355',
          accent: '#e87d4e',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        hand: ['Caveat', 'Comic Sans MS', 'Brush Script MT', 'cursive'],
        sketch: ['"Coming Soon"', 'Comic Sans MS', 'cursive'],
      },
      boxShadow: {
        'wowoo': '0 2px 8px rgba(0,0,0,0.08)',
        'wowoo-lg': '0 4px 16px rgba(0,0,0,0.12)',
        'hand': '2px 3px 0px rgba(45,45,45,0.8), 4px 6px 0px rgba(45,45,45,0.1)',
        'hand-lg': '3px 4px 0px rgba(45,45,45,0.8), 6px 8px 0px rgba(45,45,45,0.1)',
      },
      animation: {
        'wiggle': 'wiggle 0.5s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
      },
      borderRadius: {
        'hand': '20px 20px 25px 25px',
        'hand-lg': '24px 24px 32px 32px',
      },
      borderWidth: {
        'hand': '3px',
      },
    },
  },
  plugins: [],
}
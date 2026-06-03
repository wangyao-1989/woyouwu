/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F7F5F2',
          50:  '#FDFCFA',
          100: '#F7F5F2',
          200: '#F0EDE8',
          300: '#EBE7E0',
        },
        warm: {
          900: '#222222',
          700: '#555555',
          600: '#777777',
          500: '#999999',
          400: '#B0A89E',
          300: '#D5CFC5',
          200: '#EBE7E0',
          100: '#F0EDE8',
        },
        tag: {
          yellow:  '#FFF8E1',
          purple:  '#F3E5F5',
          blue:    '#E3F2FD',
          pink:    '#FCE4EC',
          green:   '#E8F5E9',
        },
        primary: {
          DEFAULT: '#222222',
          50:  '#F7F5F2',
          100: '#F0EDE8',
          200: '#D5CFC5',
          300: '#B0A89E',
          400: '#999999',
          500: '#777777',
          600: '#555555',
          700: '#444444',
          800: '#333333',
          900: '#222222',
        },
        secondary: {
          DEFAULT: '#2563EB',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', 'sans-serif'],
        kai: ['KaiTi', 'STKaiti', 'AR PL UKai CN', '楷体', 'serif'],
      },
      borderRadius: {
        card: '30px',
        btn: '999px',
        tag: '999px',
        mini: '6px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.08)',
        float: '0 6px 20px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}

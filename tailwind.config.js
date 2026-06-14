/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
      colors: {
        orange: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        gray: {
          850: '#1a1f2e',
          900: '#111827',
          950: '#0a0e1a',
        },
      },
    },
  },
  plugins: [],
};

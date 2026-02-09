/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Custom color palette for kids games - vibrant and playful
        primary: {
          50: '#fef3e2',
          100: '#fce7c5',
          200: '#f9cf8b',
          300: '#f5b750',
          400: '#f29f16',
          500: '#e88b09',
          600: '#cc6c05',
          700: '#a94d08',
          800: '#893d0e',
          900: '#72330f',
        },
        secondary: {
          50: '#edf8ff',
          100: '#d6eeff',
          200: '#b5e2ff',
          300: '#83d2ff',
          400: '#48b6ff',
          500: '#1e93ff',
          600: '#0672ff',
          700: '#0059eb',
          800: '#0849be',
          900: '#0d4195',
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
        display: ['Outfit', 'system-ui'],
        rounded: ['Nunito', 'system-ui'],
      },
    },
  },
  plugins: [],
};

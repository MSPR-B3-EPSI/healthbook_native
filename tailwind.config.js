/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007AFF',
          dark: '#0056B3',
        },
        background: '#F5F5F5',
        surface: '#FFFFFF',
        border: {
          DEFAULT: '#E1E4E8',
          focus: '#007AFF',
        },
        input: '#FAFAFA',
        text: {
          primary: '#1A1A1A',
          secondary: '#6B6B6B',
          inverse: '#FFFFFF',
          muted: '#9AA0A6',
        },
        danger: '#E53935',
        success: '#2E7D32',
      },
    },
  },
  plugins: [],
};

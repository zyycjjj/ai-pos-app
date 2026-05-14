/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        pos: {
          background: '#F7F6F2',
          surface: '#FFFFFF',
          ink: '#171717',
          muted: '#6F6F67',
          line: '#E7E3DA',
          accent: '#0A7A61',
          warm: '#F4B860',
          danger: '#C84630',
        },
      },
      borderRadius: {
        pos: '8px',
      },
    },
  },
  plugins: [],
};

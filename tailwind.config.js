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
          surfaceElevated: '#FFFCF7',
          surfaceMuted: '#EEE9DF',
          ink: '#171717',
          muted: '#6F6F67',
          subtle: '#8B918B',
          line: '#E7E3DA',
          lineStrong: '#C8C1B4',
          accent: '#0A7A61',
          accentMuted: '#DDEDE8',
          warm: '#F4B860',
          success: '#168A5B',
          warning: '#B7791F',
          danger: '#C84630',
          info: '#2F6EA3',
          inverse: '#FFFFFF',
        },
      },
      borderRadius: {
        pos: '8px',
      },
    },
  },
  plugins: [],
};

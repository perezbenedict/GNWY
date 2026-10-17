/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0B0E13',
        surface: '#121722',
        violet: '#E8C77A',
        lavender: '#E8C77A',
        lime: '#E8C77A',
        yellow: '#F5DFA6',
        crimson: '#B3223A',
        ink: '#EDEFF3',
        muted: '#9AA3B2',
      },
      borderRadius: {
        card: '2rem',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

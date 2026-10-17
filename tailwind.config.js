/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0B0817',
        surface: '#120E24',
        violet: '#7C3AED',
        lavender: '#A78BFA',
        lime: '#C6FF4A',
        yellow: '#FDE68A',
        ink: '#F4F1FF',
        muted: '#A9A3C4',
      },
      borderRadius: {
        card: '2rem',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

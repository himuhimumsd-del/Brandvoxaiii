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
          DEFAULT: '#6C5CE7',
          hover: '#5A4BD1',
          light: 'rgba(108, 92, 231, 0.15)',
          glow: 'rgba(108, 92, 231, 0.4)'
        },
        darkBg: '#0F0F0F',
        surface: {
          DEFAULT: '#1A1A1A',
          elevated: '#242424',
          hover: '#2A2A2A'
        },
        success: '#00B894',
        error: '#E17055',
        warning: '#FDCB6E'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 15px rgba(108, 92, 231, 0.3)'
      },
      borderRadius: {
        xl: '12px',
        lg: '8px'
      }
    },
  },
  plugins: [],
}

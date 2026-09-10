/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0d10',
        surface: {
          DEFAULT: '#16161a',
          elevated: '#202025',
          card: '#222228',
          cardLight: '#2a2a32',
          highlight: 'rgba(255, 255, 255, 0.06)',
        },
        primary: {
          DEFAULT: '#6e3ff5', // Bright purple from reference "View" button
          light: '#8b5cf6',
          dark: '#5827dd',
          subtle: 'rgba(110, 63, 245, 0.14)',
          border: 'rgba(110, 63, 245, 0.4)',
        },
        physics: {
          DEFAULT: '#38bdf8',
          light: '#7dd3fc',
          dark: '#0284c7',
          subtle: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.3)',
        },
        chemistry: {
          DEFAULT: '#c084fc',
          light: '#e9d5ff',
          dark: '#9333ea',
          subtle: 'rgba(192, 132, 252, 0.12)',
          border: 'rgba(192, 132, 252, 0.3)',
        },
        biology: {
          DEFAULT: '#34d399',
          light: '#6ee7b7',
          dark: '#059669',
          subtle: 'rgba(52, 211, 153, 0.12)',
          border: 'rgba(52, 211, 153, 0.3)',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.07)',
          DEFAULT: '#2c2c34',
          hover: '#3a3a44',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        'btn': '0 4px 16px -2px rgba(110, 63, 245, 0.4)',
      }
    },
  },
  plugins: [],
}

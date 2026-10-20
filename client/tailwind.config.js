/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          950: '#120309',
          900: '#1c0610',
          850: '#260918',
          800: '#320d20',
          700: '#48132f',
          600: '#641c42',
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#f4dc8a',
          dark: '#a8841b',
          muted: '#8e7121',
          metallic: '#dfb743',
        },
        ivory: {
          DEFAULT: '#fbf8f2',
          soft: '#f4ede1',
          muted: '#e3d8c5',
        },
        roseGray: {
          DEFAULT: '#a8949b',
          light: '#c8b6bd',
          dark: '#69555c',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.35)',
        'gold-glow-lg': '0 0 45px rgba(212, 175, 55, 0.5)',
        'maroon-deep': '0 10px 30px -10px rgba(18, 3, 9, 0.9)',
      },
      animation: {
        'flame-flicker': 'flicker 2s infinite ease-in-out',
        'subtle-pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
          '25%': { transform: 'scale(1.08, 0.95) translateY(-1px)', opacity: '0.92' },
          '50%': { transform: 'scale(0.96, 1.05) translateY(-2px)', opacity: '1' },
          '75%': { transform: 'scale(1.04, 0.98) translateY(-0.5px)', opacity: '0.95' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}

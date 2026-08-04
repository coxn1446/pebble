/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette (from pebble brand guidelines)
        slate: '#334155',
        ocean: '#2563EB',
        'ocean-hover': '#1D4ED8',
        pebble: '#A8A29E',
        moss: '#5B7C4D',
        sandstone: '#D6B37A',

        // Semantic tokens (derived from brand palette)
        ink: '#334155',
        muted: '#A8A29E',
        background: '#F5F6F8',
        surface: '#FFFFFF',
        border: '#DDD6D0',
        accent: '#2563EB',
        'accent-hover': '#1D4ED8',
        white: '#FFFFFF',
        black: '#000000',
      },

      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '1.75rem',
      },

      letterSpacing: {
        tagline: '0.16em',
      },

      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },

      height: {
        dvh: '100dvh',
      },

      minHeight: {
        dvh: '100dvh',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.72' },
        },
      },

      animation: {
        float: 'float 7s ease-in-out infinite',
        'fade-up': 'fade-up 0.55s ease-out both',
        'soft-pulse': 'soft-pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

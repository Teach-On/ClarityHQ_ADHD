/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Use the CSS variables for our color system
        primary: {
          50: 'rgb(var(--color-primary), 0.05)',
          100: 'rgb(var(--color-primary), 0.1)',
          200: 'rgb(var(--color-primary), 0.2)',
          300: 'rgb(var(--color-primary), 0.3)',
          400: 'rgb(var(--color-primary), 0.4)',
          500: 'rgb(var(--color-primary), 0.5)',
          600: 'rgb(var(--color-primary), 0.6)',
          700: 'rgb(var(--color-primary), 0.7)',
          800: 'rgb(var(--color-primary), 0.8)',
          900: 'rgb(var(--color-primary), 0.9)',
          950: 'rgb(var(--color-primary), 0.95)',
        },
        secondary: {
          50: 'rgb(var(--color-secondary), 0.05)',
          100: 'rgb(var(--color-secondary), 0.1)',
          200: 'rgb(var(--color-secondary), 0.2)',
          300: 'rgb(var(--color-secondary), 0.3)',
          400: 'rgb(var(--color-secondary), 0.4)',
          500: 'rgb(var(--color-secondary), 0.5)',
          600: 'rgb(var(--color-secondary), 0.6)',
          700: 'rgb(var(--color-secondary), 0.7)',
          800: 'rgb(var(--color-secondary), 0.8)',
          900: 'rgb(var(--color-secondary), 0.9)',
          950: 'rgb(var(--color-secondary), 0.95)',
        },
        accent: {
          50: 'rgb(var(--color-accent), 0.05)',
          100: 'rgb(var(--color-accent), 0.1)',
          200: 'rgb(var(--color-accent), 0.2)',
          300: 'rgb(var(--color-accent), 0.3)',
          400: 'rgb(var(--color-accent), 0.4)',
          500: 'rgb(var(--color-accent), 0.5)',
          600: 'rgb(var(--color-accent), 0.6)',
          700: 'rgb(var(--color-accent), 0.7)',
          800: 'rgb(var(--color-accent), 0.8)',
          900: 'rgb(var(--color-accent), 0.9)',
          950: 'rgb(var(--color-accent), 0.95)',
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'fade-out': 'fade-out 0.3s ease-in-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-out': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(10px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
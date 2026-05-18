/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff1f4f',
          dark: '#b80f33',
          light: '#ff6b87',
        },
        secondary: {
          DEFAULT: '#5b7cfa',
          dark: '#3654d4',
          light: '#8ea5ff',
        },
        candy: {
          yellow: '#ffd447',
          mint: '#2ee59d',
          cyan: '#22d3ee',
          ink: '#172033',
          paper: '#fffaf0',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.94)', opacity: '0' },
          '70%': { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0) rotate(-1deg)' },
          '50%': { transform: 'translateY(-8px) rotate(1deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideUp: 'slideUp 0.5s ease-out',
        pop: 'pop 0.35s ease-out',
        bob: 'bob 3s ease-in-out infinite',
        shimmer: 'shimmer 3s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};

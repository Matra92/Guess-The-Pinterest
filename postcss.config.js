// Configure PostCSS to use the dedicated Tailwind CSS PostCSS plugin.  
// Tailwind v4 no longer exposes its PostCSS plugin directly and instead ships `@tailwindcss/postcss`.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
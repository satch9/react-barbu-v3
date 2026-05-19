/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        felt:        '#1a6b3c',
        'felt-dark': '#134f2d',
        card:        '#fafaf5',
      },
    },
  },
  plugins: [],
}

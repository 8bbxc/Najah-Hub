/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'najah-primary': '#0ea5ff', // electric blue
        'najah-secondary': '#0ea5a4',
        'najah-accent': '#ff7a59',
      },
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
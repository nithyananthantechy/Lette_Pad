/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        tamil: ['Noto Sans Tamil', 'sans-serif'],
        sans:  ['Inter', 'Noto Sans Tamil', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6fd',
          500: '#3b5bdb',
          600: '#2f4ac2',
          700: '#2541a8',
          800: '#1a1a2e',
          900: '#0f0f1a',
        },
      },
    },
  },
  plugins: [],
}

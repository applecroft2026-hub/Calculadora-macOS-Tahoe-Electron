/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mac: {
          bg: '#1C1C1E',
          orange: '#FF9500',
          darkGray: '#333333',
          lightGray: '#A5A5A5',
          text: '#FFFFFF',
        }
      },
    },
  },
  plugins: [],
}

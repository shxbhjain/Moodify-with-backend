module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // enable class-based dark mode (recommended)
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["light", "dark", "coffee"], // choose or add themes you want
    // You can also set a single theme string: theme: "cupcake"
  },
}

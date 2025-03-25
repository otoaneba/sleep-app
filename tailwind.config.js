module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,css}", // Scans all files in src for Tailwind classes
    "./index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
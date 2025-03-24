module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,css}", // Scans all files in src for Tailwind classes
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
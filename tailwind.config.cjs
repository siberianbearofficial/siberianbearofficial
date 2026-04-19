/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.{html,njk}",
    "./scripts/**/*.{js,mjs}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F8FC",
        ink: "#263044",
        cobalt: "#245CFF",
        signal: "#FF4D2E",
        mist: "#E5ECF8",
        sand: "#00A676"
      },
      boxShadow: {
        glow: "0 28px 90px rgba(16, 24, 40, 0.12)",
        card: "0 12px 40px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};

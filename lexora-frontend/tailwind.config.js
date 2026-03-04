/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bgDark: "#0A0F1C",
        bgLight: "#F4F7FF",
        primary: "#4F8CFF",
        accent: "#00F5C8",
        glass: "rgba(255,255,255,0.08)",
      },
      backdropBlur: {
        glass: "20px",
      },
      boxShadow: {
        glow: "0 0 30px rgba(79,140,255,0.6)",
      },
    },
  },
  plugins: [],
};
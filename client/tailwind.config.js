/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Poppins", "sans-serif"],
    },
    extend: {
      colors: {
        primary: "#ff0054",
        "primary-light": "#ff4d87",
        "primary-dark": "#cc0043",
      },
    },
  },
  plugins: [],
};

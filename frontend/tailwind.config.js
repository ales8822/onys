/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "app-bg": "#121212",
        "sidebar-bg": "#1E1E1E",
        "modal-bg": "#2C2C2C",
        accent: "#10a37f",
      },
    },
  },
  plugins: [],
};

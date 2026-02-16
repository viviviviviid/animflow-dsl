/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/react/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2196F3",
        secondary: "#4CAF50",
        accent: "#FF9800",
        error: "#F44336",
        warning: "#FFC107",
        success: "#4CAF50",
      },
    },
  },
  plugins: [],
};

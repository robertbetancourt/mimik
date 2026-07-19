/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FFF7ED",
        surface: "#FFFBF4",
        ink: "#2B2118",
        primary: "#FF7A45",
        "primary-light": "#FF9A6B",
        "primary-dark": "#F0632C",
        success: "#3DBE6C",
        error: "#E85C4A",
      },
      fontFamily: {
        sans: ["Urbanist_400Regular"],
        "sans-semibold": ["Urbanist_600SemiBold"],
        "sans-bold": ["Urbanist_700Bold"],
      },
    },
  },
  plugins: [],
};

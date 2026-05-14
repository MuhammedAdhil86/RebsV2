/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        // Ensuring Poppins is the primary font
        sans: ["Poppins", "Helvetica", "Arial", "sans-serif"],
      },
      // Strictly defined only normal weight
      fontWeight: {
        normal: "400",
      },
      keyframes: {
        slide: {
          "0%": { transform: "translateX(-50%)" },
          "50%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        slide: "slide 4s linear infinite",
      },
    },
  },
  plugins: [
    function ({ addBase, theme }) {
      const fontSans = theme("fontFamily.sans");
      const fontStack = Array.isArray(fontSans) ? fontSans.join(", ") : fontSans;

      addBase({
        // Force Poppins Regular 400 globally
        "html, body": {
          fontFamily: fontStack,
          fontWeight: "400",
          "-webkit-font-smoothing": "antialiased",
          "-moz-osx-font-smoothing": "grayscale",
        },
        // Force all interactive elements to regular weight
        "button, input, optgroup, select, textarea": {
          fontFamily: "inherit",
          fontWeight: "400",
        },
        // Target placeholders specifically
        "input::placeholder, textarea::placeholder": {
          fontWeight: "400",
        },
        // Reset headings so they don't default to bold
        "h1, h2, h3, h4, h5, h6": {
          fontWeight: "400",
        },
      });
    },
  ],
};
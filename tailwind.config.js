// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        oddDays: "#6CCFF6",
        campSites: "#337357",
        messages: "#F9A620",
        evenDays: "#2E2D4D",
        photos: "#E26D5A",
        black: "#000000",
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
};

// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        oddDays: "#6CCFF6", //sky-300
        campSites: "#337357", //emerald-700
        messages: "#F9A620", //amber-500
        evenDays: "#2E2D4D", //blue-950
        photos: "#E26D5A", //red-400
        black: "#000000", //black
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
};

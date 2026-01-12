/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}", "./src/webui/**/*.{js,html}"],
  theme: {
    extend: {
      colors: {
        space: {
          950: "#09090b",
          900: "#0f0f11",
          850: "#121214",
          800: "#18181b",
          border: "#27272a",
        },
        neon: {
          purple: "#a855f7",
          green: "#22c55e",
          cyan: "#06b6d4",
          yellow: "#eab308",
          red: "#ef4444",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("daisyui")],
  daisyui: {
    themes: ["dark"],
  },
};

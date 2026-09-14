/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        stone: {
          50: "#F6F4EF",
          100: "#EDE9DE",
          200: "#DCD3BF",
        },
        umber: {
          500: "#7A5A3A",
          600: "#5E4429",
          700: "#453320",
        },
        forest: {
          600: "#33402E",
          700: "#242E20",
          900: "#141B10",
        },
        brass: {
          400: "#B99457",
          500: "#A67E3D",
        },
        ink: {
          800: "#1C1A16",
          900: "#0F0D0B",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 60px -20px rgba(23, 19, 16, 0.25)",
        card: "0 10px 30px -12px rgba(23, 19, 16, 0.18)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

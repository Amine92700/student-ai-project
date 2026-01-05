import type { Config } from "tailwindcss";


const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d6e9ff",
          200: "#aed4ff",
          300: "#7fb9ff",
          400: "#4e98ff",
          500: "#1f78ff",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#143a9c",
          900: "#0a2440"
        }
      },
      keyframes: {
        bgmove: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" }
        },
        fadeup: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        bgmove: "bgmove 10s ease-in-out infinite",
        fadeup: "fadeup .35s ease-out both"
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,0.18)"
      }
    }
  },
  plugins: []
};

export default config;

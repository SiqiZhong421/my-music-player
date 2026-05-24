/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: "rgb(var(--c-bg) / <alpha-value>)",
          surface: "rgb(var(--c-surface) / <alpha-value>)",
          elevated: "rgb(var(--c-elevated) / <alpha-value>)",
          accent: "#fa2d48",
          accentHover: "#ff4d6a",
          text: "rgb(var(--c-text) / <alpha-value>)",
          textSecondary: "rgb(var(--c-text-secondary) / <alpha-value>)",
          textTertiary: "rgb(var(--c-text-tertiary) / <alpha-value>)",
          border: "rgb(var(--c-border) / <alpha-value>)",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        marquee: "marquee 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

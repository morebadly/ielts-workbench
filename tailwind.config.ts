import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#FAF8F4",
          card: "#FFFFFF",
          soft: "#F2EEE7"
        },
        ink: {
          DEFAULT: "#2B2A28",
          soft: "#5C5A55",
          muted: "#8A867E"
        },
        brand: {
          50: "#F1F5F2",
          100: "#DCE7DE",
          200: "#B8CFBC",
          300: "#8FB295",
          400: "#6B9572",
          500: "#4F7A57",
          600: "#3E6044",
          700: "#314D36"
        },
        accent: {
          warm: "#D9A86C",
          rose: "#C97F6E",
          sky: "#7BA9C4"
        }
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif"
        ],
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"]
      },
      boxShadow: {
        soft: "0 1px 2px rgba(43,42,40,0.04), 0 4px 16px rgba(43,42,40,0.06)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;

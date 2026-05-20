import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0B0F19",
          surface: "#111827",
          panel: "#1F2937",
          border: "#374151",
          accent: "#3B82F6",
          success: "#10B981",
          danger: "#EF4444",
          warning: "#F59E0B"
        }
      }
    },
  },
  plugins: [],
};
export default config;
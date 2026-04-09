import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lx: {
          primary: "var(--lx-primary)",
          gold: "var(--lx-gold)",
          ink: "var(--lx-ink)",
          paper: "var(--lx-paper)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;

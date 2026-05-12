/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Art Deco headings
        heading: ["'Playfair Display'", "serif"],
        // Modern UI text
        sans: ["Inter", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        // Gold and surface colors
        "primary-gold": "var(--color-primary)",
        "primary-gold-muted": "var(--color-primary-muted)",
        "deco-bg": "var(--color-background)",
        "deco-surface": "var(--color-surface)",
        "deco-surface-soft": "var(--color-surface-soft)",
        "deco-card": "var(--color-card)",
        "deco-input": "var(--color-input)",
        "deco-foreground": "var(--color-foreground)",
        "deco-muted": "var(--color-muted-foreground)",
        "border-gold": "var(--deco-border-gold)",
        "border-gold-muted": "var(--color-border)",

        // Accent and status colors
        accent: "var(--color-accent)",
        danger: "var(--color-danger)",
        "danger-soft": "var(--color-danger-soft)",

        // Kanban column colors (jewel tones)
        "column-applied": "var(--color-column-applied)",
        "column-interviewing": "var(--color-column-interviewing)",
        "column-rejected": "var(--color-column-rejected)",
        "column-offer": "var(--color-column-offer)",
      },
      boxShadow: {
        // Art Deco shadows
        "deco-panel": "var(--deco-shadow-panel)",
        "deco-card": "var(--shadow-card)",
        "deco-glow": "var(--deco-shadow-glow)",
      },
      letterSpacing: {
        // Wide letter spacing for luxury typography
        "deco-wide": "0.15em",
        "deco-wider": "0.25em",
      },
    },
  },
  plugins: [],
};

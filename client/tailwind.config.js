/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      colors: {
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
        accent: "var(--color-accent)",
        danger: "var(--color-danger)",
        "danger-soft": "var(--color-danger-soft)",
        "column-applied": "var(--color-column-applied)",
        "column-interviewing": "var(--color-column-interviewing)",
        "column-rejected": "var(--color-column-rejected)",
        "column-offer": "var(--color-column-offer)",
      },
      boxShadow: {
        "deco-panel": "var(--deco-shadow-panel)",
        "deco-card": "var(--shadow-card)",
        "deco-glow": "var(--deco-shadow-glow)",
      },
    },
  },
};

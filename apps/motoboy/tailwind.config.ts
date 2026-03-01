/**
 * Tailwind CSS v4 — tema definido via @theme em src/index.css.
 * Este arquivo exporta os tokens semanticos como referencia e compatibilidade.
 */
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#222e6e",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#1dace7",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#fca322",
          foreground: "#1a1a1a",
        },
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
        },
        background: "#ffffff",
        foreground: "#1a1a1a",
        muted: {
          DEFAULT: "#f4f4f5",
          foreground: "#71717a",
        },
        border: "#e4e4e7",
        input: "#e4e4e7",
        ring: "#222e6e",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a1a",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a1a",
        },
      },
      borderRadius: {
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      fontFamily: {
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};

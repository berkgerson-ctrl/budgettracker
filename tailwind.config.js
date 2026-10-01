/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,html}"],
  theme: {
    extend: {
      colors: {
        outer: "var(--outer)",
        app: "var(--app)",
        card: "var(--card)",
        teal: { DEFAULT: "var(--teal)", deep: "var(--teal-deep)", tint: "var(--teal-tint)" },
        ink: { DEFAULT: "var(--ink)", soft: "var(--ink-soft)", faint: "var(--ink-faint)" },
        line: "var(--line)",
        coral: { DEFAULT: "var(--coral)", tint: "var(--coral-tint)" },
        amber: { DEFAULT: "var(--amber)", tint: "var(--amber-tint)" },
        violet: { DEFAULT: "var(--violet)", tint: "var(--violet-tint)" }
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"]
      },
      boxShadow: {
        shell: "0 30px 60px -20px rgba(20,30,60,0.25)",
        fab: "0 10px 24px -6px rgba(22,184,147,0.55)"
      }
    },
  },
  plugins: [],
}


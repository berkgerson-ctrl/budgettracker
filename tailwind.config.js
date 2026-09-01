/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,html}"],
  theme: {
    extend: {
      colors: {
        outer: "#DCDFEA",
        app: "#F4F5FA",
        card: "#FFFFFF",
        teal: { DEFAULT: "#16B893", deep: "#0E9678", tint: "#E4F7F1" },
        ink: { DEFAULT: "#1C2430", soft: "#8891A0", faint: "#B7BECC" },
        line: "#EBEDF3",
        coral: { DEFAULT: "#F0665A", tint: "#FDEBE9" },
        amber: { DEFAULT: "#E8A23A", tint: "#FBF1E1" },
        violet: { DEFAULT: "#7C6CF0", tint: "#EDEBFD" }
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


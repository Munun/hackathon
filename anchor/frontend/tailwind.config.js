/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}", // Adding html and absolute src check
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090a",
        "medical-emerald": "#10b981",
        "trust-indigo": "#6366f1",
      },
      // Adding a test utility to see if Tailwind is working
      spacing: {
        'test-99': '99px',
      }
    },
  },
  plugins: [],
}
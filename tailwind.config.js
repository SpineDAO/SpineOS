/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spine: {
          bg: '#040812',
          dark: '#0a1020',
          card: '#0d1528',
          border: '#1a2540',
          accent: '#00c2ff',
          gold: '#f0b429',
          green: '#10b981',
          red: '#ef4444',
          text: '#e2e8f0',
          muted: '#8892b0',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}

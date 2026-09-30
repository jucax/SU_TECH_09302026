/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // OneBridge brand palette, see CLAUDE.md brand guide.
        navy: '#091D3F', // Deep Navy: wordmark, body text, dark backgrounds, trust/authority
        blue: '#408EEC', // Bridge Blue: primary digital accent, AI/data-facing elements
        orange: '#F68835', // Connection Orange: warm accent, CTAs, business-facing highlights
        gray: '#F5F6F8', // Soft Gray: neutral background for documents and UI
      },
      fontFamily: {
        sans: ['Montserrat', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

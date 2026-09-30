/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // OneBridge brand palette, see CLAUDE.md brand guide.
        navy: '#091D3F', // Deep Navy: wordmark, body text, dark backgrounds, trust/authority
        blue: '#408EEC', // Bridge Blue: illustrative accent, chart stroke, decorative connection details
        orange: '#F68835', // Connection Orange: warm accent, human/business-facing highlights
        gray: '#F5F6F8', // Soft Gray: page canvas

        // Interaction/status tokens, see docs/DASHBOARD_STYLE_PLAN.md section 3.
        // Named distinctly from the brand tokens above: "blue" stays reserved
        // for illustrative/decorative use, "action" for filled controls,
        // links, and focus rings, since those need higher contrast than the
        // brand blue provides on a white surface.
        'action-blue': '#1D4ED8',
        'subtle-blue': '#EFF6FF',
        border: '#DFE6EF',
        secondary: '#52627A',
        success: '#166534',
        'success-surface': '#F0FDF4',
        review: '#92400E',
        'review-surface': '#FFFBEB',
        error: '#B91C1C',
        'error-surface': '#FEF2F2',
      },
      fontFamily: {
        sans: ['Montserrat', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 18px rgba(9,29,63,0.04)',
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
// Kijitech style: one type scale, one color system, no ad-hoc sizes.
// Floors: body copy never under 14px, meta never under 11px.
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm cinematic ink scale (Prime Video depth, IfaLode warmth)
        ink: {
          950: '#0B0908',
          900: '#14100D',
          850: '#171310',
          800: '#201913',
          700: '#2A211A',
          600: '#3A2E23',
        },
        cream: {
          DEFAULT: '#F3ECE0',
          dim: '#A99A87',
          faint: '#7D7060',
        },
        gold: {
          DEFAULT: '#D4A574',
          light: '#E8C9A0',
          deep: '#8B5E3C',
        },
        live: '#E5484D',
        success: '#3FB97F',
        brand: {
          primary: 'var(--brand-primary, #8B5E3C)',
          secondary: 'var(--brand-secondary, #D4A574)',
          accent: 'var(--brand-accent, #C41E3A)',
        },
      },
      fontFamily: {
        display: ['"Aeonik Pro Bold"', 'Figtree', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', 'sans-serif'],
        brand: ['Figtree', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        meta: ['11px', { lineHeight: '1.35' }],
        caption: ['12px', { lineHeight: '1.4' }],
        body: ['14px', { lineHeight: '1.55' }],
        lead: ['16px', { lineHeight: '1.6' }],
        title: ['20px', { lineHeight: '1.25' }],
        headline: ['26px', { lineHeight: '1.15' }],
        display: ['34px', { lineHeight: '1.08' }],
      },
      boxShadow: {
        card: '0 8px 28px rgba(0,0,0,0.45)',
        sheet: '0 -12px 40px rgba(0,0,0,0.55)',
        glow: '0 6px 24px rgba(212,165,116,0.25)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-400px 0' },
          to: { backgroundPosition: '400px 0' },
        },
        'live-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease both',
        shimmer: 'shimmer 1.4s linear infinite',
        'live-pulse': 'live-pulse 1.6s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
}

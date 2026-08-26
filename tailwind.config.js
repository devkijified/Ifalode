/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #8B5E3C)',
          secondary: 'var(--brand-secondary, #D4A574)',
          accent: 'var(--brand-accent, #C41E3A)',
        },
      },
      fontFamily: {
        brand: ['var(--brand-font)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

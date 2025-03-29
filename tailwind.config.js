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
        background: 'var(--color-background)',
        'background-light': 'var(--color-background-light)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        sidebar: 'var(--color-sidebar)',
        'tag-bg': 'var(--color-tag-bg)',
        'tag-bg-selected': 'var(--color-tag-bg-selected)',
        waveform: 'var(--color-waveform)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 
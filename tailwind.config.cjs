module.exports = {
  content: ['./src/**/*.{astro,js,jsx,ts,tsx,md}', './public/**/*.html'],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        'accent-glow': 'var(--accent-glow)',
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        muted: 'var(--muted)',
        border: 'var(--border)',
      },
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'],
        sans: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 15px var(--accent-glow)',
        'glow-lg': '0 0 25px var(--accent-glow)',
      }
    },
  },
  plugins: [],
};

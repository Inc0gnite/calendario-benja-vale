import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          card: 'var(--surface-card)',
        },
        content: {
          primary: 'var(--text-primary)',
          muted: 'var(--text-muted)',
        },
        benja: '#5DCAA5',
        vale: '#AFA9EC',
        urgency: {
          alta: '#F09595',
          media: '#FAC775',
          baja: '#C0DD97',
        },
      },
    },
  },
  plugins: [],
}

export default config

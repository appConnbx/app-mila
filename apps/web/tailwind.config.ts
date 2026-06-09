import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cor-âncora do MILA (ciano) — destaques e ações
        brand: {
          DEFAULT: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
        },
        // Superfícies do tema escuro
        surface: {
          DEFAULT: '#0B1120', // fundo do app
          card: '#111A2E', // cards
          border: '#1E293B', // bordas sutis
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.4), 0 1px 6px -1px rgb(0 0 0 / 0.3)',
      },
    },
  },
  plugins: [],
}

export default config

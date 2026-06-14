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
        // Cor-âncora do MILA — via CSS var p/ tema por contexto
        // (corporativo=ciano/azul, família=verde). Ver --brand-rgb em globals.css.
        brand: {
          DEFAULT: 'rgb(var(--brand-rgb) / <alpha-value>)',
          500: 'rgb(var(--brand-500-rgb) / <alpha-value>)',
          600: '#0891B2',
          700: '#0E7490',
        },
        // Superfícies via CSS var (dark = valores atuais; light sobrescreve em
        // globals.css). Var-backed para que TODAS as variantes (bg-surface/70,
        // border-surface-border etc.) virem claro no tema light automaticamente.
        surface: {
          DEFAULT: 'rgb(var(--surface-rgb) / <alpha-value>)', // fundo do app
          card: 'rgb(var(--surface-card-rgb) / <alpha-value>)', // cards
          border: 'rgb(var(--surface-border-rgb) / <alpha-value>)', // bordas sutis
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

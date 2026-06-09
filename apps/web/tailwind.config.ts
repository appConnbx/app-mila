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
        brand: {
          DEFAULT: '#4338CA',
          dark: '#312E81',
          light: '#EEF2FF',
        },
      },
    },
  },
  plugins: [],
}

export default config

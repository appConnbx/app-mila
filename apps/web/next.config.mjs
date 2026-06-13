import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mila/supabase', '@mila/shared'],
  // Slugs públicos passaram para inglês (produto internacional). Redirects 301
  // preservam links já compartilhados/indexados (ex.: política de privacidade
  // referenciada pelas lojas de app).
  async redirects() {
    const map = {
      '/privacidade': '/privacy',
      '/seguranca': '/security',
      '/bem-vindo': '/welcome',
      '/definir-senha': '/create-password',
      '/recuperar': '/forgot-password',
      '/br-empresa': '/br-business',
      '/br-pessoal': '/br-personal',
    }
    return Object.entries(map).map(([source, destination]) => ({ source, destination, permanent: true }))
  },
}

export default withNextIntl(nextConfig)

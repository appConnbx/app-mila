import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mila/supabase', '@mila/shared'],
  // Slugs públicos passaram para inglês (produto internacional). Redirects 301
  // preservam links já compartilhados/indexados (ex.: política de privacidade
  // referenciada pelas lojas de app).
  async redirects() {
    // Slugs simples (públicos).
    const simple = {
      '/privacidade': '/privacy',
      '/seguranca': '/security',
      '/bem-vindo': '/welcome',
      '/definir-senha': '/create-password',
      '/recuperar': '/forgot-password',
      '/br-empresa': '/br-business',
      '/br-pessoal': '/br-personal',
      '/organograma': '/org-chart',
      '/painel': '/panel',
      '/perfil': '/profile',
      '/assinatura': '/subscription',
    }
    return [
      ...Object.entries(simple).map(([source, destination]) => ({ source, destination, permanent: true })),
      // Rotas internas com subrotas — específicos antes dos curingas (ordem importa).
      { source: '/demandas/nova', destination: '/tasks/new', permanent: true },
      { source: '/demandas/:path*', destination: '/tasks/:path*', permanent: true },
      { source: '/estrutura/usuarios', destination: '/structure/users', permanent: true },
      { source: '/estrutura/:path*', destination: '/structure/:path*', permanent: true },
      { source: '/eventos/:path*', destination: '/events/:path*', permanent: true },
    ]
  },
}

export default withNextIntl(nextConfig)

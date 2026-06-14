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
  // Headers de segurança globais. Referrer-Policy strict-origin-when-cross-origin
  // já evita vazar token_hash (em /auth/confirm) via Referer p/ terceiros.
  async headers() {
    // CSP em modo REPORT-ONLY: não bloqueia nada (só reporta violações no
    // console), para validar a allowlist com Stripe/Supabase/Hotmart sem risco
    // de quebrar o checkout. Depois de observar 0 violações reais em produção,
    // basta trocar a chave para 'Content-Security-Policy' (enforce).
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      // Next.js injeta scripts inline de hidratação; libs podem usar eval.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      'img-src \'self\' data: blob: https:',
      "font-src 'self' data:",
      // Supabase (REST/Realtime/Storage), Stripe e Resend.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.resend.com",
      // Stripe.js (se carregado) e frames de pagamento.
      'frame-src https://js.stripe.com https://*.stripe.com https://hooks.stripe.com',
      // Checkout externo (Hotmart/Stripe) é navegação por link, não form-post.
      "form-action 'self'",
    ].join('; ')
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)

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
    // CSP em ENFORCE. No dev, libera o WebSocket/HTTP do HMR (localhost); em
    // produção, só os destinos reais (Supabase/Stripe/Resend). script-src mantém
    // 'unsafe-inline'/'unsafe-eval' (exigidos pela hidratação do Next sem nonce;
    // endurecer com nonce é um follow-up).
    const dev = process.env.NODE_ENV !== 'production'
    const connectSrc = [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://api.stripe.com',
      'https://api.resend.com',
      ...(dev ? ['ws://localhost:*', 'http://localhost:*'] : []),
    ].join(' ')
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
      // Supabase (REST/Realtime/Storage), Stripe e Resend (+ HMR no dev).
      `connect-src ${connectSrc}`,
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
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)

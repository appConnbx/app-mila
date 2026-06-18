import type { MetadataRoute } from 'next'

const SITE = 'https://www.appmila.co'

// Apenas rotas PÚBLICAS e indexáveis. Não inclui /cbx (secreto), rotas
// autenticadas, /login, /subscribe e /welcome (noindex). A home tem alternates
// hreflang (pt-BR / en / es). LPs de anúncio ficam fora (tráfego pago).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const home: MetadataRoute.Sitemap[number] = {
    url: SITE,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 1,
    alternates: {
      languages: { 'pt-BR': SITE, en: `${SITE}/en`, es: `${SITE}/es` },
    },
  }
  const pages = ['/en', '/es', '/affiliates', '/privacy', '/security', '/start', '/start-family-free'].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: path === '/en' || path === '/es' ? 0.9 : 0.6,
  }))
  return [home, ...pages]
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import NextTopLoader from 'nextjs-toploader'
import { Analytics } from '@/components/analytics'
import { ConsentBanner } from '@/components/consent-banner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = 'https://www.appmila.co'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // default = fallback; template = "<título da página> · appMila" nas sub-rotas.
  title: { default: 'appMila — Nunca mais perca uma demanda', template: '%s · appMila' },
  description:
    'O appMila captura demandas por voz e organiza tudo com responsável e prazo — no trabalho e em casa. Sistema web, app de celular e agente para computador.',
  applicationName: 'appMila',
  keywords: ['gestão de demandas', 'tarefas por voz', 'produtividade', 'lista de tarefas', 'organização de equipe', 'organização familiar', 'appMila'],
  authors: [{ name: 'appMila' }],
  creator: 'appMila',
  publisher: 'appMila',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'appMila',
    locale: 'pt_BR',
    url: SITE_URL,
    title: 'appMila — Nunca mais perca uma demanda',
    description: 'Capture, delegue, acompanhe e conclua. Suas demandas do trabalho e as pessoais, na mesma conta.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'appMila — Nunca mais perca uma demanda',
    description: 'Capture demandas por voz e organize tudo com responsável e prazo.',
  },
  // Verificação de propriedade do site no Google Search Console (usada para a
  // verificação da organização no Google Play Console).
  verification: { google: '5hzlYqQLvDYvBj7Se3QXJy8jfjVFN6fVP2FGMI4eZIk' },
}

// Dados estruturados (JSON-LD) — ajudam o Google a entender a marca como
// entidade e alimentam rich results e o AI Overviews. Sitewide.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'appMila',
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      description: 'Plataforma de gestão de demandas por voz para empresas e famílias.',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'appMila',
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: ['pt-BR', 'en', 'es'],
    },
  ],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Tema vem do cookie (padrão: escuro). Renderizado no servidor → sem flash.
  const theme = (await cookies()).get('mila_theme')?.value === 'light' ? 'light' : ''
  return (
    <html lang="pt-BR" className={theme}>
      <body className={inter.className}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        <NextTopLoader
          color="#22D3EE"
          height={3}
          showSpinner={true}
          shadow="0 0 10px #22D3EE,0 0 5px #22D3EE"
          crawlSpeed={120}
          speed={250}
        />
        {children}
        <ConsentBanner />
        <Analytics />
      </body>
    </html>
  )
}

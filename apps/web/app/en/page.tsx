// Landing institucional em inglês com idioma fixo pela URL (sem cookie) — para
// campanhas de anúncio. Reusa a mesma landing de "/"; o idioma é resolvido pelo
// pathname em i18n/request.ts. Apenas os metadados são localizados aqui.
import type { Metadata } from 'next'

export { default } from '../page'

export const metadata: Metadata = {
  title: 'appMila — Never lose a task again',
  description:
    'appMila turns conversations, meetings and decisions into organized execution — at work and at home. Capture, delegate, track and complete. All in one account.',
  alternates: {
    canonical: 'https://www.appmila.co/en',
    languages: {
      'pt-BR': 'https://www.appmila.co',
      en: 'https://www.appmila.co/en',
      es: 'https://www.appmila.co/es',
      'x-default': 'https://www.appmila.co',
    },
  },
  openGraph: {
    title: 'appMila — Never lose a task again',
    description:
      'Capture, delegate, track and complete. Your work and personal tasks in one account.',
    url: 'https://www.appmila.co/en',
    siteName: 'appMila',
    locale: 'en_US',
    type: 'website',
  },
}

// Landing institucional em inglês com idioma fixo pela URL (sem cookie) — para
// campanhas de anúncio. Reusa a mesma landing de "/"; o idioma é resolvido pelo
// pathname em i18n/request.ts. Apenas os metadados são localizados aqui.
import type { Metadata } from 'next'

export { default } from '../page'

export const metadata: Metadata = {
  title: 'MILA — Never lose a task again',
  description:
    'MILA turns conversations, meetings and decisions into organized execution — at work and at home. Capture, delegate, track and complete. All in one account.',
  alternates: { canonical: 'https://www.appmila.co/en' },
  openGraph: {
    title: 'MILA — Never lose a task again',
    description:
      'Capture, delegate, track and complete. Your work and personal tasks in one account.',
    url: 'https://www.appmila.co/en',
    siteName: 'MILA',
    locale: 'en_US',
    type: 'website',
  },
}

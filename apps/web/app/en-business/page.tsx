import type { Metadata } from 'next'
import { SalesPage } from '../_sales/SalesPage'
import { enBusiness } from '../_sales/content'

export const metadata: Metadata = {
  title: 'appMila for Business — Stop losing tasks in hallway talk',
  description:
    'Turn what gets agreed in meetings and chats into tasks with an owner, deadline and follow-up. Corporate plans with a 7-day money-back guarantee.',
  alternates: {
    canonical: 'https://www.appmila.co/en-business',
    languages: {
      'pt-BR': 'https://www.appmila.co/br-business',
      en: 'https://www.appmila.co/en-business',
      es: 'https://www.appmila.co/es-business',
      'x-default': 'https://www.appmila.co/en-business',
    },
  },
  openGraph: {
    title: 'appMila for Business — Execution leadership can see',
    description: 'Capture by voice, delegate with deadlines and track your whole team.',
    url: 'https://www.appmila.co/en-business',
    locale: 'en_US',
    type: 'website',
  },
}

export default function Page() {
  return <SalesPage c={enBusiness} />
}

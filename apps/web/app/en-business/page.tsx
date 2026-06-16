import type { Metadata } from 'next'
import { SalesPage } from '../_sales/SalesPage'
import { enBusiness } from '../_sales/content'

export const metadata: Metadata = {
  title: 'appMila for Business — Stop losing tasks in hallway talk',
  description:
    'Turn what gets agreed in meetings and chats into tasks with an owner, deadline and follow-up. Corporate plans with a 7-day money-back guarantee.',
  openGraph: {
    title: 'appMila for Business — Execution leadership can see',
    description: 'Capture by voice, delegate with deadlines and track your whole team.',
    locale: 'en_US',
    type: 'website',
  },
}

export default function Page() {
  return <SalesPage c={enBusiness} />
}

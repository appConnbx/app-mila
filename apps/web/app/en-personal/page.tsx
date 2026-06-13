import type { Metadata } from 'next'
import { SalesPage } from '../_sales/SalesPage'
import { enPersonal } from '../_sales/content'

export const metadata: Metadata = {
  title: 'MILA for Families — Clear agreements, a calmer home',
  description:
    'Organize the household with an owner, deadline and reminders. Family plans with a 7-day guarantee. Try free, no card required.',
  openGraph: {
    title: 'MILA for Families — Less nagging, more harmony',
    description: 'Capture by voice, agree on who does what, and organize the whole home. Start free.',
    locale: 'en_US',
    type: 'website',
  },
}

export default function Page() {
  return <SalesPage c={enPersonal} />
}

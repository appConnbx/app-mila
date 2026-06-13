import type { Metadata } from 'next'
import { SalesPage } from '../_sales/SalesPage'
import { esPersonal } from '../_sales/content'

export const metadata: Metadata = {
  title: 'MILA para Familias — Acuerdos claros, un hogar tranquilo',
  description:
    'Organiza el hogar con responsable, plazo y recordatorios. Planes familia con garantía de 7 días. Prueba gratis, sin tarjeta.',
  openGraph: {
    title: 'MILA para Familias — Menos reclamos, más armonía',
    description: 'Captura por voz, acuerda quién hace qué y organiza toda la casa. Empieza gratis.',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function Page() {
  return <SalesPage c={esPersonal} />
}

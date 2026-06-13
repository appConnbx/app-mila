import type { Metadata } from 'next'
import { SalesPage } from '../_sales/SalesPage'
import { esBusiness } from '../_sales/content'

export const metadata: Metadata = {
  title: 'MILA para Empresas — Deja de perder tareas en el pasillo',
  description:
    'Convierte lo que se acuerda en reuniones y chats en tareas con responsable, plazo y seguimiento. Planes corporativos con garantía de 7 días.',
  openGraph: {
    title: 'MILA para Empresas — Ejecución que la dirección ve',
    description: 'Captura por voz, delega con plazos y sigue a todo tu equipo.',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function Page() {
  return <SalesPage c={esBusiness} />
}

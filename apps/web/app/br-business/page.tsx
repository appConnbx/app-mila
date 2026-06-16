import type { Metadata } from 'next'
import { SalesPage } from '../_sales/SalesPage'
import { brEmpresa } from '../_sales/content'

export const metadata: Metadata = {
  title: 'appMila para Empresas — Sua equipe para de perder demanda',
  description:
    'Transforme o que é combinado em reuniões e conversas em tarefas com responsável, prazo e acompanhamento. Planos corporativos com garantia de 7 dias.',
  openGraph: {
    title: 'appMila para Empresas — Execução que a liderança enxerga',
    description: 'Capture por voz, delegue com prazo e acompanhe a equipe inteira. Planos anuais em até 12x.',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function Page() {
  return <SalesPage c={brEmpresa} />
}

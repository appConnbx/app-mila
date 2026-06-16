import type { Metadata } from 'next'
import { SalesPage } from '../_sales/SalesPage'
import { brPessoal } from '../_sales/content'

export const metadata: Metadata = {
  title: 'appMila para Famílias — Combinados claros, casa em harmonia',
  description:
    'Organize a rotina da casa com responsável, prazo e lembrete. Planos família a partir de R$97/ano, com garantia de 7 dias. Teste grátis sem cartão.',
  openGraph: {
    title: 'appMila para Famílias — Menos cobrança, mais harmonia',
    description: 'Capture por voz, combine quem faz o quê e organize a casa toda. Comece grátis.',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function Page() {
  return <SalesPage c={brPessoal} />
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/config'
import { StartWizard } from './_wizard'

export const metadata: Metadata = {
  title: 'Começar · appMila',
  description: 'Responda algumas perguntas rápidas e descubra o plano ideal do appMila.',
}

const DICT_KEYS = [
  'title', 'subtitle', 'back', 'q1Title', 'q1Business', 'q1BusinessSub', 'q1Personal', 'q1PersonalSub',
  'mostChosen',
  'bizSizeTitle', 'bizUpTo20', 'bizUpTo50', 'bizUpTo200', 'bizUnlimited',
  'bizPerkTitle', 'bizPerkDesc', 'bizPerkCta',
  'famSizeTitle', 'famJustMe', 'famUpTo5', 'famUpTo10',
  'reflectTitle', 'reflectForget', 'reflectChase', 'reflectScatter', 'reflectAck', 'continue',
  'doubtTitle', 'doubtDesc', 'doubtCta',
  'resultTitle', 'recommendedBadge', 'perMonth', 'startCta', 'refund', 'perkLine',
  'freeTitle', 'freeDesc', 'freeStart', 'freeUpsell',
] as const

export default async function StartPage() {
  const t = await getTranslations('start')
  const tl = await getTranslations('landing')
  const locale = (await getLocale()) as Locale
  const isBR = locale === 'pt-BR'

  // BR: Hotmart. INTL: venda direta via Stripe. Hotmart fica só para afiliados.
  // off= BR = ofertas ANUAIS/12x (recriadas jun/2026); as mensais antigas ficaram só para assinantes.
  const checkout = (offBR: string, plan: string) =>
    isBR ? `https://pay.hotmart.com/P106262837P?off=${offBR}` : `/subscribe?plan=${plan}&next=%2Fstart&lang=${locale}`
  const perMonth = tl('plans.perMonth')

  // Corporativo BR = anual em 12x; Família BR = total anual + opção 12x; INTL = assinatura mensal.
  const corp = (intl: string, parcela: string, total: string) =>
    isBR
      ? { priceMain: `R$${parcela}`, priceUnit: '', priceSub: `12x · ou R$${total} à vista (plano anual)` }
      : { priceMain: `US$${intl}`, priceUnit: perMonth, priceSub: '' }
  const fam = (intl: string, annual: string, parcela: string) =>
    isBR
      ? { priceMain: `R$${annual}`, priceUnit: '/ano', priceSub: `ou 12x de R$${parcela}` }
      : { priceMain: `US$${intl}`, priceUnit: perMonth, priceSub: '' }

  const plans = {
    starter: { name: 'Starter', users: tl('plans.starterUsers'), href: checkout('wyitwc3d', 'starter'), ...corp('87', '297', '3.564') },
    growth: { name: 'Growth', users: tl('plans.growthUsers'), href: checkout('2kxlbff2', 'growth'), ...corp('167', '497', '5.964') },
    scale: { name: 'Scale', users: tl('plans.scaleUsers'), href: checkout('abpzxjap', 'scale'), ...corp('337', '697', '8.364') },
    enterprise: { name: 'Enterprise', users: tl('plans.enterpriseUsers'), href: checkout('yl7fpa6u', 'enterprise'), ...corp('667', '1.117', '13.404') },
    family: { name: 'Family', users: tl('plans.familyUsers'), href: checkout('i67ovflk', 'family'), ...fam('13', '97', '8,08') },
    familyplus: { name: 'Family Plus', users: tl('plans.familyPlusUsers'), href: checkout('tfkn6adh', 'family_plus'), ...fam('17', '127', '10,58') },
  }

  const dict = Object.fromEntries(DICT_KEYS.map((k) => [k, t(k)])) as Record<string, string>

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-slate-950">M</span>
          <span className="text-lg font-bold tracking-tight text-white">appMila</span>
        </Link>
      </div>
      <StartWizard dict={dict} plans={plans} freeHref="/start-family-free" />
    </main>
  )
}

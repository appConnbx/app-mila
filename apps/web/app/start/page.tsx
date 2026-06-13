import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import type { Locale } from '@/i18n/config'
import { StartWizard } from './_wizard'

export const metadata: Metadata = {
  title: 'Começar · MILA',
  description: 'Responda algumas perguntas rápidas e descubra o plano ideal do MILA.',
}

const DICT_KEYS = [
  'title', 'subtitle', 'back', 'q1Title', 'q1Business', 'q1BusinessSub', 'q1Personal', 'q1PersonalSub',
  'bizSizeTitle', 'bizUpTo20', 'bizUpTo50', 'bizUpTo200', 'bizUnlimited',
  'bizPerkTitle', 'bizPerkDesc', 'bizPerkCta',
  'famSizeTitle', 'famJustMe', 'famUpTo5', 'famUpTo10', 'famMore',
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
  const cur = isBR ? 'R$' : 'US$'

  const checkout = (offBR: string, offINTL: string) =>
    isBR ? `https://pay.hotmart.com/P106262837P?off=${offBR}` : `https://pay.hotmart.com/Y106267582L?off=${offINTL}`

  const plans = {
    starter: { name: 'Starter', price: isBR ? '200' : '80', users: tl('plans.starterUsers'), href: checkout('hcxkobrb', 'gwlaaeei') },
    growth: { name: 'Growth', price: isBR ? '300' : '150', users: tl('plans.growthUsers'), href: checkout('7d5lrof8', 'qqkl7a6p') },
    scale: { name: 'Scale', price: isBR ? '1.000' : '400', users: tl('plans.scaleUsers'), href: checkout('u7x98fyz', 'v7x1xwst') },
    enterprise: { name: 'Enterprise', price: isBR ? '1.500' : '500', users: tl('plans.enterpriseUsers'), href: checkout('9gacabk6', 'g901biby') },
    family: { name: 'Family', price: isBR ? '37' : '9', users: tl('plans.familyUsers'), href: checkout('f7nrog01', 'gmafnne4') },
    familyplus: { name: 'Family Plus', price: isBR ? '50' : '13', users: tl('plans.familyPlusUsers'), href: checkout('d3c9cwha', 'e4qsc1yt') },
  }

  const dict = Object.fromEntries(DICT_KEYS.map((k) => [k, t(k)])) as Record<string, string>

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-slate-950">M</span>
          <span className="text-lg font-bold tracking-tight text-white">MILA</span>
        </Link>
      </div>
      <StartWizard dict={dict} plans={plans} cur={cur} freeHref="/start-family-free" />
    </main>
  )
}

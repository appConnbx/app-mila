import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui'
import type { Locale } from '@/i18n/config'

export default async function AssinaturaPage() {
  const t = await getTranslations('billing')
  const tl = await getTranslations('landing')
  const locale = (await getLocale()) as Locale
  const isBR = locale === 'pt-BR'
  const cur = isBR ? 'R$' : 'US$'

  const checkout = (offBR: string, offINTL: string) =>
    isBR ? `https://pay.hotmart.com/P106262837P?off=${offBR}` : `https://pay.hotmart.com/Y106267582L?off=${offINTL}`

  const supabase = await createClient()
  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: { kind?: string; plan_slug?: string } | null }> }
  const { data: ctx } = await sb.rpc('my_billing_context')
  const isFamily = (ctx?.kind ?? 'corporate') === 'family'
  const sponsored = ctx?.plan_slug === 'connbx-family-sponsored'

  const corpPlans = [
    { name: 'Starter', users: tl('plans.starterUsers'), price: isBR ? '200' : '80', href: checkout('hcxkobrb', 'gwlaaeei'), featured: false },
    { name: 'Growth', users: tl('plans.growthUsers'), price: isBR ? '300' : '150', href: checkout('7d5lrof8', 'qqkl7a6p'), featured: true },
    { name: 'Scale', users: tl('plans.scaleUsers'), price: isBR ? '1.000' : '400', href: checkout('u7x98fyz', 'v7x1xwst'), featured: false },
    { name: 'Enterprise', users: tl('plans.enterpriseUsers'), price: isBR ? '1.500' : '500', href: checkout('9gacabk6', 'g901biby'), featured: false },
  ]
  const familyPlans = [
    { name: 'Family', users: tl('plans.familyUsers'), price: isBR ? '37' : '9', href: checkout('f7nrog01', 'gmafnne4'), featured: true },
    { name: 'Family Plus', users: tl('plans.familyPlusUsers'), price: isBR ? '50' : '13', href: checkout('d3c9cwha', 'e4qsc1yt'), featured: false },
  ]
  const plans = isFamily ? familyPlans : corpPlans
  const desc = sponsored ? t('renewSponsored') : isFamily ? t('renewDescFamily') : t('renewDescCorp')

  return (
    <div className="mx-auto mt-8 max-w-4xl">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-amber-500/15 text-2xl">⚠️</div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{t('renewTitle')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">{desc}</p>
      </div>

      <div className={`mt-8 grid gap-5 ${isFamily ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        {plans.map((p) => (
          <div key={p.name} className={`glass relative flex flex-col p-6 ${p.featured ? 'glow-top border-brand/50 ring-2 ring-brand/40' : ''}`}>
            {p.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-3 py-0.5 text-[11px] font-bold text-slate-950">
                ⭐ {tl('plans.featuredTag')}
              </span>
            )}
            <p className="text-sm font-semibold text-white">{p.name}</p>
            <p className="text-xs text-slate-400">{p.users}</p>
            <p className="mt-4 text-3xl font-extrabold text-white">
              {cur}{p.price}<span className="text-base font-medium text-slate-400">{tl('plans.perMonth')}</span>
            </p>
            <a
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className={`mt-5 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                p.featured ? 'bg-brand text-slate-950 hover:bg-brand-500' : 'border border-white/10 text-slate-200 hover:bg-white/5'
              }`}
            >
              {tl('plans.start')}
            </a>
          </div>
        ))}
      </div>

      {isFamily && (
        <p className="mt-6 text-center text-sm text-slate-400">
          {t('renewFreeHint')}{' '}
          <Link href="/start-family-free" className="font-semibold text-emerald-300 hover:underline">{tl('plans.freeCta')}</Link>
        </p>
      )}

      <div className="mx-auto mt-8 flex max-w-sm flex-col items-center gap-2">
        <Button href="/dashboard" variant="secondary" className="w-full">{t('switch')}</Button>
        <a href="https://consumer.hotmart.com/purchases" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 transition hover:text-slate-300">
          {t('manage')}
        </a>
        <a href="mailto:help@appmila.co" className="text-xs text-slate-500 transition hover:text-slate-300">{t('help')}</a>
      </div>
    </div>
  )
}

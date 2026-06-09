import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Aurora } from '@/components/ui'
import type { Locale } from '@/i18n/config'
import { startNow } from './_actions'

export const metadata: Metadata = {
  title: 'MILA — Nunca mais perca uma demanda',
  description:
    'O MILA transforma conversas, reuniões e decisões em execução organizada — no trabalho e em casa. Capture, delegue, acompanhe e conclua. Tudo em uma só conta.',
  openGraph: {
    title: 'MILA — Nunca mais perca uma demanda',
    description:
      'Capture, delegue, acompanhe e conclua. Suas demandas do trabalho e as pessoais, na mesma conta.',
    url: 'https://www.appmila.co',
    siteName: 'MILA',
    locale: 'pt_BR',
    type: 'website',
  },
}

/* ---------- Ícones (inline, leves) ---------- */
function Check({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path d="M5 10.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path d="M4 10h11M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- Marca ---------- */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-slate-950">M</span>
      <span className="text-lg font-bold tracking-tight text-white">MILA</span>
    </Link>
  )
}

/* ---------- Mockup do dashboard (hero) ---------- */
async function DashboardMockup() {
  const t = await getTranslations('landing.mockup')
  const bars = [40, 62, 48, 75, 55, 88, 70, 96, 64, 82, 58, 90]
  return (
    <div className="glass glow-top glow-blue relative p-3 sm:p-4">
      {/* topo */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[11px] font-black text-slate-950">M</span>
          <span className="text-sm font-semibold text-white">{t('title')}</span>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">{t('onTrack')}</span>
      </div>

      {/* KPIs */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[
          { l: t('kpiOpen'), v: '23', c: 'text-white' },
          { l: t('kpiInProgress'), v: '11', c: 'text-amber-300' },
          { l: t('kpiOverdue'), v: '02', c: 'text-rose-300' },
          { l: t('kpiDone'), v: '47', c: 'text-emerald-300' },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
            <p className="text-[10px] text-slate-400">{k.l}</p>
            <p className={`mt-0.5 text-xl font-bold ${k.c}`}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* gráfico */}
      <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-300">{t('chartTitle')}</p>
          <p className="text-[11px] text-slate-500">{t('chartDelta')}</p>
        </div>
        <div className="mt-3 flex h-24 items-end gap-1.5">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-brand-700/40 to-brand"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* linha de demanda */}
      <div className="mt-3 space-y-1.5">
        {[
          { t: t('row1Title'), who: t('row1Sub'), s: t('row1Tag') },
          { t: t('row2Title'), who: t('row2Sub'), s: t('row2Tag') },
        ].map((d) => (
          <div key={d.t} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-100">{d.t}</p>
              <p className="text-[10px] text-slate-500">{d.who}</p>
            </div>
            <span className="ml-2 shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">{d.s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ===================================================================== */

export default async function LandingPage() {
  const t = await getTranslations('landing')
  const locale = (await getLocale()) as Locale

  const bold = { b: (chunks: ReactNode) => <span className="font-semibold text-white">{chunks}</span> }
  const pains = t.raw('triggers.items') as { p: string; r: string }[]
  const steps = t.raw('how.steps') as { n: string; t: string; d: string }[]
  const corpBullets = t.raw('contexts.corpBullets') as string[]
  const familyBullets = t.raw('contexts.familyBullets') as string[]

  const tiers = [
    { name: t('plans.tierTimeName'), users: t('plans.tierTimeUsers'), tag: t('plans.tierTimeTag'), price: '200' },
    { name: t('plans.tierGrowthName'), users: t('plans.tierGrowthUsers'), tag: t('plans.tierGrowthTag'), price: '300', featured: true },
    { name: t('plans.tierScaleName'), users: t('plans.tierScaleUsers'), tag: t('plans.tierScaleTag'), price: '1.000' },
  ]
  const familyTiers = [
    { n: 1, v: '20' },
    { n: 2, v: '30' },
    { n: 3, v: '40' },
    { n: 4, v: '50' },
    { n: 5, v: '55' },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-slate-200">
      <Aurora />
      {/* ---------------- NAV ---------------- */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-surface/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Logo />
          <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#como" className="transition hover:text-white">{t('nav.how')}</a>
            <a href="#contextos" className="transition hover:text-white">{t('nav.contexts')}</a>
            <a href="#planos" className="transition hover:text-white">{t('nav.plans')}</a>
            <a href="#afiliados" className="transition hover:text-white">{t('nav.affiliates')}</a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher current={locale} />
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:inline-block">
              {t('nav.signIn')}
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
            >
              {t('nav.start')}
            </Link>
          </div>
        </nav>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
          <div className="absolute right-0 top-40 h-[360px] w-[360px] rounded-full bg-orange-500/10 blur-[120px]" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-16 lg:grid-cols-2 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {t('hero.badge')}
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t.rich('hero.headline', {
                hl: (chunks) => (
                  <span className="bg-gradient-to-r from-brand to-orange-400 bg-clip-text text-transparent">{chunks}</span>
                ),
              })}
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">{t('hero.subtitle')}</p>

            <form action={startNow} className="mt-7 flex max-w-md flex-col gap-2 sm:flex-row">
              <input
                type="email"
                name="email"
                placeholder={t('hero.emailPlaceholder')}
                aria-label="E-mail"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
              >
                {t('hero.cta')} <Arrow className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-3 text-xs text-slate-500">{t('hero.finePrint')}</p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand/10 via-transparent to-orange-500/10 blur-2xl" />
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ---------------- GATILHOS ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="glass p-8 sm:p-10">
          <h2 className="max-w-2xl text-2xl font-bold text-white sm:text-3xl">{t('triggers.title')}</h2>
          <p className="mt-3 max-w-2xl text-slate-400">{t('triggers.desc')}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pains.map((b) => (
              <div key={b.p} className="glass p-5">
                <p className="text-sm font-medium text-slate-400">{b.p}</p>
                <div className="mt-3 flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <p className="text-sm font-medium text-slate-100">{b.r}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- COMO FUNCIONA ---------------- */}
      <section id="como" className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">{t('how.kicker')}</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{t('how.title')}</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="glass p-6">
              <span className="text-sm font-bold text-brand">{s.n}</span>
              <h3 className="mt-2 text-lg font-semibold text-white">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- DOIS CONTEXTOS ---------------- */}
      <section id="contextos" className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">{t('contexts.title')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">{t('contexts.subtitle')}</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Corporativo */}
          <div className="glass glow-top relative overflow-hidden p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">{t('contexts.corpKicker')}</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{t('contexts.corpTitle')}</h3>
            <p className="mt-3 text-slate-400">{t('contexts.corpDesc')}</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {corpBullets.map((i) => (
                <li key={i} className="flex items-start gap-2.5 text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {i}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-slate-300">
              {t.rich('contexts.corpResult', bold)}
            </p>
          </div>

          {/* Família */}
          <div className="glass relative overflow-hidden p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-300">{t('contexts.familyKicker')}</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{t('contexts.familyTitle')}</h3>
            <p className="mt-3 text-slate-400">{t('contexts.familyDesc')}</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {familyBullets.map((i) => (
                <li key={i} className="flex items-start gap-2.5 text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" /> {i}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-slate-300">
              {t.rich('contexts.familyResult', bold)}
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- PLANOS ---------------- */}
      <section id="planos" className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">{t('plans.kicker')}</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{t('plans.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">{t('plans.subtitle')}</p>
        </div>

        {/* Corporativo */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-white">{t('plans.corpTitle')}</h3>
          <p className="text-sm text-slate-400">{t('plans.corpSub')}</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {tiers.map((p) => (
              <div
                key={p.name}
                className={`glass relative p-6 ${p.featured ? 'glow-top border-brand/40' : ''}`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-[11px] font-bold text-slate-950">
                    {p.tag}
                  </span>
                )}
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <p className="text-xs text-slate-400">{p.users}</p>
                <p className="mt-4 text-4xl font-extrabold text-white">
                  R${p.price}
                  <span className="text-base font-medium text-slate-400">{t('plans.perMonth')}</span>
                </p>
                {!p.featured && <p className="mt-1 text-xs text-slate-500">{p.tag}</p>}
                <Link
                  href="/login"
                  className={`mt-5 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                    p.featured
                      ? 'bg-brand text-slate-950 hover:bg-brand-500'
                      : 'border border-white/10 text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {t('plans.start')}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">{t.rich('plans.corpNote', bold)}</p>
        </div>

        {/* Família */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-white">{t('plans.familyTitle')}</h3>
          <p className="text-sm text-slate-400">{t('plans.familySub')}</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="glass p-6 lg:col-span-2">
              <p className="text-sm font-semibold text-white">{t('plans.familyCardTitle')}</p>
              <p className="text-xs text-slate-400">{t('plans.familyCardSub')}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {familyTiers.map((f) => (
                  <div key={f.n} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
                    <p className="text-xs text-slate-400">{t('plans.familyPeople', { count: f.n })}</p>
                    <p className="mt-1 text-xl font-bold text-white">R${f.v}</p>
                    <p className="text-[10px] text-slate-500">{t('plans.perMonth')}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass flex flex-col justify-center p-6">
              <p className="text-sm text-slate-300">{t('plans.familyAside')}</p>
              <Link
                href="/login"
                className="mt-4 block rounded-xl bg-orange-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
              >
                {t('plans.familyCta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- INDIQUE E GANHE ---------------- */}
      <section id="afiliados" className="mx-auto max-w-6xl px-4 py-16">
        <div className="glass glow-top relative overflow-hidden p-8 sm:p-12">
          <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1.4fr,1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                {t('affiliates.badge')}
              </span>
              <h2 className="mt-4 text-3xl font-bold text-white">{t('affiliates.title')}</h2>
              <p className="mt-3 max-w-xl text-slate-400">{t('affiliates.desc')}</p>
            </div>
            <div className="lg:justify-self-end">
              <Link
                href="/affiliates"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                {t('affiliates.cta')} <Arrow className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-center text-xs text-slate-500 lg:text-right">{t('affiliates.soon')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA FINAL ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="glass glow-top p-10 text-center sm:p-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold text-white sm:text-4xl">{t('finalCta.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">{t('finalCta.subtitle')}</p>
          <div className="mt-7 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
            >
              {t('finalCta.cta')} <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-500">{t('footer.tagline')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-400">
            <a href="#como" className="transition hover:text-white">{t('nav.how')}</a>
            <a href="#planos" className="transition hover:text-white">{t('nav.plans')}</a>
            <a href="#afiliados" className="transition hover:text-white">{t('nav.affiliates')}</a>
            <Link href="/login" className="transition hover:text-white">{t('nav.signIn')}</Link>
            <LanguageSwitcher current={locale} />
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-slate-500">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

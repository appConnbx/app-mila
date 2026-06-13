import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Aurora } from '@/components/ui'
import type { Locale } from '@/i18n/config'

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

function MicGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
    </svg>
  )
}

// Altura única para os três mockups da galeria (todos do mesmo tamanho).
const MOCK_FRAME = 'glass relative h-80 w-full overflow-hidden p-4'

/* ---------- Mockup: gadget de fácil acesso no computador (Windows) ---------- */
async function GadgetMockup() {
  const t = await getTranslations('landing')
  return (
    <div className={MOCK_FRAME}>
      <div className="relative h-full w-full rounded-xl border border-white/5 bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="pointer-events-none absolute -left-8 top-8 h-32 w-32 rounded-full bg-brand/10 blur-3xl" />
        {/* gadget encostado na borda direita */}
        <div className="absolute right-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1.5 rounded-l-2xl border border-white/10 bg-white/[0.06] px-2 py-2.5 backdrop-blur">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[10px] font-black text-slate-950">M</span>
          <span className="rounded-full bg-rose-500/80 px-1.5 text-[9px] font-bold text-white">3</span>
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand/15 text-brand"><MicGlyph className="h-3.5 w-3.5" /></span>
        </div>
        {/* balão: demanda capturada por voz */}
        <div className="absolute right-12 top-1/2 w-44 -translate-y-1/2 rounded-xl border border-white/10 bg-slate-900/90 p-3 shadow-xl">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-brand">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" /> {t('eco.voiceTitle')}
          </p>
          <p className="mt-1 text-xs leading-snug text-slate-100">“{t('eco.gadgetExample')}”</p>
          <div className="mt-2 flex items-center gap-1">
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-slate-300">{t('mockup.kpiInProgress')}</span>
            <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] text-brand">amanhã</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Mockup: app no celular com microfone em evidência ---------- */
async function MobileMockup() {
  const t = await getTranslations('landing.mockup')
  const rows = [
    { t: t('row1Title'), s: t('kpiInProgress') },
    { t: t('row2Title'), s: 'amanhã' },
    { t: t('row1Title'), s: t('kpiOpen') },
  ]
  return (
    <div className={`${MOCK_FRAME} grid place-items-center`}>
      <div className="relative mx-auto h-full w-36 rounded-[1.8rem] border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-2.5 shadow-xl">
        <div className="mx-auto mb-2.5 h-1 w-9 rounded-full bg-white/15" />
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-2">
              <p className="truncate text-[10px] font-medium text-slate-100">{r.t}</p>
              <span className="mt-1 inline-block rounded-full bg-brand/10 px-1.5 text-[9px] text-brand">{r.s}</span>
            </div>
          ))}
        </div>
        {/* botão de voz em evidência */}
        <div className="absolute bottom-4 left-1/2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full bg-brand text-slate-950 shadow-lg ring-4 ring-brand/25">
          <MicGlyph className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

/* ---------- Mockup compacto: sistema web (mesma altura dos demais) ---------- */
async function WebMockup() {
  const t = await getTranslations('landing.mockup')
  const bars = [44, 66, 52, 78, 60, 90, 72, 96]
  return (
    <div className={`${MOCK_FRAME} flex flex-col`}>
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[10px] font-black text-slate-950">M</span>
          <span className="text-xs font-semibold text-white">{t('title')}</span>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">{t('onTrack')}</span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {[
          { l: t('kpiOpen'), v: '23', c: 'text-white' },
          { l: t('kpiInProgress'), v: '11', c: 'text-amber-300' },
          { l: t('kpiOverdue'), v: '02', c: 'text-rose-300' },
          { l: t('kpiDone'), v: '47', c: 'text-emerald-300' },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
            <p className="truncate text-[9px] text-slate-400">{k.l}</p>
            <p className={`mt-0.5 text-base font-bold ${k.c}`}>{k.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-1 flex-col rounded-lg border border-white/5 bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-slate-300">{t('chartTitle')}</p>
          <p className="text-[10px] text-slate-500">{t('chartDelta')}</p>
        </div>
        <div className="mt-2 flex flex-1 items-end gap-1.5">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-700/40 to-brand" style={{ height: `${h}%` }} />
          ))}
        </div>
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
  const corpBullets = t.raw('contexts.corpBullets') as string[]
  const familyBullets = t.raw('contexts.familyBullets') as string[]

  // Preço e checkout por locale: pt-BR → produto Brasil (R$); en/es → International (US$).
  const isBR = locale === 'pt-BR'
  const cur = isBR ? 'R$' : 'US$'
  const perMonth = t('plans.perMonth')
  // BR: produtos anuais via Hotmart (corp 12x; família total anual + 12x).
  // INTL: venda direta via Stripe (assinatura mensal). Hotmart fica só para afiliados.
  // TODO(hotmart-br): ao recriar as ofertas BR como ANUAL/12x, trocar os off= BR pelos novos códigos.
  const checkout = (offBR: string, plan: string) =>
    isBR
      ? `https://pay.hotmart.com/P106262837P?off=${offBR}`
      : `/api/stripe/checkout?plan=${plan}&next=%2F`
  const corpPlans = [
    { name: 'Starter', users: t('plans.starterUsers'), intl: '87', brParcela: '297', brTotal: '3.564', href: checkout('hcxkobrb', 'starter') },
    { name: 'Growth', users: t('plans.growthUsers'), intl: '167', brParcela: '497', brTotal: '5.964', href: checkout('7d5lrof8', 'growth') },
    { name: 'Scale', users: t('plans.scaleUsers'), intl: '337', brParcela: '697', brTotal: '8.364', href: checkout('u7x98fyz', 'scale'), featured: true },
    { name: 'Enterprise', users: t('plans.enterpriseUsers'), intl: '667', brParcela: '1.117', brTotal: '13.404', href: checkout('9gacabk6', 'enterprise') },
  ]
  const familyPlans = [
    { name: 'Family', users: t('plans.familyUsers'), intl: '13', brAnnual: '97', brParcela: '8,08', href: checkout('f7nrog01', 'family') },
    { name: 'Family Plus', users: t('plans.familyPlusUsers'), intl: '17', brAnnual: '127', brParcela: '10,58', href: checkout('d3c9cwha', 'family_plus'), featured: true },
  ]

  // Bloco de preço: INTL (assinatura/mês) · BR corp (12x + à vista) · BR família (anual + 12x).
  type PlanLike = { intl: string; brParcela?: string; brTotal?: string; brAnnual?: string }
  const priceBlock = (p: PlanLike) => {
    if (!isBR)
      return (
        <p className="mt-4 text-3xl font-extrabold text-white">
          {cur}{p.intl}<span className="text-base font-medium text-slate-400">{perMonth}</span>
        </p>
      )
    if (p.brAnnual)
      return (
        <div className="mt-4">
          <p className="text-3xl font-extrabold text-white">
            R${p.brAnnual}<span className="text-base font-medium text-slate-400">/ano</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">ou 12x de R${p.brParcela}</p>
        </div>
      )
    return (
      <div className="mt-4">
        <p className="flex items-baseline gap-1.5">
          <span className="text-sm font-medium text-slate-400">12x</span>
          <span className="text-3xl font-extrabold text-white">R${p.brParcela}</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-400">ou R${p.brTotal} à vista · plano anual</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden text-slate-200">
      <Aurora />
      {/* ---------------- NAV ---------------- */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-surface/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Logo />
          <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#empresas" className="transition hover:text-white">{t('nav.business')}</a>
            <a href="#pessoal" className="transition hover:text-white">{t('nav.personal')}</a>
            <a href="#afiliados" className="transition hover:text-white">{t('nav.affiliates')}</a>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher current={locale} />
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:inline-block">
              {t('nav.signIn')}
            </Link>
            <Link
              href="/start"
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

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/start"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
              >
                {t('hero.cta')} <Arrow className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              >
                {t('nav.signIn')}
              </Link>
            </div>
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

      {/* ---------------- PRATICIDADE: VOZ + DESKTOP + MOBILE ---------------- */}
      <section id="praticidade" className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">{t('eco.kicker')}</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{t('eco.title')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">{t('eco.subtitle')}</p>
        </div>

        {/* Galeria: gadget no computador · app no celular · sistema web — cada um com legenda */}
        <div className="mt-10 grid items-start gap-6 md:grid-cols-3">
          <figure className="space-y-3">
            <GadgetMockup />
            <figcaption className="text-center text-sm font-medium text-slate-300">{t('eco.capWindows')}</figcaption>
          </figure>
          <figure className="space-y-3">
            <MobileMockup />
            <figcaption className="text-center text-sm font-medium text-slate-300">{t('eco.capMobile')}</figcaption>
          </figure>
          <figure className="space-y-3">
            <WebMockup />
            <figcaption className="text-center text-sm font-medium text-slate-300">{t('eco.capWeb')}</figcaption>
          </figure>
        </div>

        {/* Vale igual para empresas e uso pessoal */}
        <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-slate-300">
          {t('eco.bothNote')}
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {/* Voz (destaque) */}
          <div className="glass glow-top relative overflow-hidden border-brand/40 p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-brand" aria-hidden>
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{t('eco.voiceTitle')}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{t('eco.voiceDesc')}</p>
            <p className="mt-3 text-xs font-medium text-brand">{t('eco.voiceHint')}</p>
          </div>

          {/* Agente Desktop */}
          <div className="glass p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-brand" aria-hidden>
                <rect x="3" y="4" width="18" height="12" rx="2" />
                <path d="M8 20h8M12 16v4" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{t('eco.desktopTitle')}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{t('eco.desktopDesc')}</p>
            <p className="mt-3 text-xs font-medium text-slate-500">{t('eco.desktopHint')}</p>
          </div>

          {/* App Mobile */}
          <div className="glass p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-brand" aria-hidden>
                <rect x="7" y="2" width="10" height="20" rx="2.5" />
                <path d="M11 18h2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">{t('eco.mobileTitle')}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{t('eco.mobileDesc')}</p>
            <p className="mt-3 text-xs font-medium text-slate-500">{t('eco.mobileHint')}</p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="#empresas"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
          >
            {t('eco.cta')} <Arrow className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ---------------- EMPRESAS ---------------- */}
      <section id="empresas" className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">{t('contexts.corpKicker')}</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{t('contexts.corpTitle')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">{t('contexts.corpDesc')}</p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
          <ul className="space-y-2.5 text-sm">
            {corpBullets.map((i) => (
              <li key={i} className="flex items-start gap-2.5 text-slate-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {i}
              </li>
            ))}
          </ul>
          <p className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm text-slate-300">
            {t.rich('contexts.corpResult', bold)}
          </p>
        </div>

        {/* Bônus: Family Plus para cada colaborador */}
        <div className="mt-6 flex items-start gap-4 rounded-2xl border border-brand/30 bg-brand/[0.06] p-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-2xl">🎁</span>
          <div>
            <p className="text-base font-semibold text-white">{t('contexts.corpPerkTitle')}</p>
            <p className="mt-1 text-sm text-slate-300">{t.rich('contexts.corpPerkDesc', bold)}</p>
          </div>
        </div>

        {/* Planos corporativos */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-white">{t('plans.corpTitle')}</h3>
          <p className="text-sm text-slate-400">{t('plans.corpSub')}</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {corpPlans.map((p) => (
              <div
                key={p.name}
                className={`glass relative flex flex-col p-6 ${
                  p.featured ? 'glow-top border-brand/50 ring-2 ring-brand/40 lg:-mt-2 lg:mb-2' : ''
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-3 py-0.5 text-[11px] font-bold text-slate-950">
                    ⭐ {t('plans.featuredTag')}
                  </span>
                )}
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <p className="text-xs text-slate-400">{p.users}</p>
                {priceBlock(p)}
                {p.featured && <p className="mt-1.5 text-xs font-medium text-brand">{t('plans.corpPopular')}</p>}
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-5 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                    p.featured ? 'bg-brand text-slate-950 hover:bg-brand-500' : 'border border-white/10 text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {t('plans.start')}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- USO PESSOAL ---------------- */}
      <section id="pessoal" className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-300">{t('contexts.familyKicker')}</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{t('contexts.familyTitle')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">{t('contexts.familyDesc')}</p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
          <ul className="space-y-2.5 text-sm">
            {familyBullets.map((i) => (
              <li key={i} className="flex items-start gap-2.5 text-slate-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" /> {i}
              </li>
            ))}
          </ul>
          <p className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm text-slate-300">
            {t.rich('contexts.familyResult', bold)}
          </p>
        </div>

        {/* Planos família — Family em destaque (mais escolhido) */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-white">{t('plans.familyTitle')}</h3>
          <p className="text-sm text-slate-400">{t('plans.familySub')}</p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {familyPlans.map((p) => (
              <div
                key={p.name}
                className={`glass relative flex flex-col p-6 ${
                  p.featured ? 'border-orange-400/50 ring-2 ring-orange-400/40' : ''
                }`}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-3 py-0.5 text-[11px] font-bold text-slate-950">
                    ⭐ {t('plans.featuredTag')}
                  </span>
                )}
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <p className="text-xs text-slate-400">{p.users}</p>
                {priceBlock(p)}
                {p.featured && <p className="mt-1.5 text-xs font-medium text-orange-300">{t('plans.familyPopular')}</p>}
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 block rounded-xl bg-orange-500 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
                >
                  {t('plans.familyCta')}
                </a>
              </div>
            ))}
          </div>

          {/* Family Free — opção de entrada, discreta e por último */}
          <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                {t('plans.freeBadge')}
              </span>
              <span><b className="text-slate-200">{t('plans.freeName')}</b> — {t('plans.freeDesc')}</span>
            </div>
            <Link
              href="/start-family-free"
              className="shrink-0 rounded-lg border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
            >
              {t('plans.freeCta')}
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">{t('plans.refundNote')}</p>
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
              href="/start"
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
            <a href="#empresas" className="transition hover:text-white">{t('nav.business')}</a>
            <a href="#pessoal" className="transition hover:text-white">{t('nav.personal')}</a>
            <a href="#afiliados" className="transition hover:text-white">{t('nav.affiliates')}</a>
            <Link href="/login" className="transition hover:text-white">{t('nav.signIn')}</Link>
            <LanguageSwitcher current={locale} />
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 text-xs text-slate-500">
            <p>{t('footer.company')}</p>
            <p>
              {t('footer.support')}: <a href="mailto:help@appmila.co" className="text-slate-400 hover:text-white">help@appmila.co</a>
              {' · '}
              {t('footer.sales')}: <a href="mailto:sales@appmila.co" className="text-slate-400 hover:text-white">sales@appmila.co</a>
              {' · '}
              {t('footer.corporate')}: <a href="mailto:mail@connbx.com.br" className="text-slate-400 hover:text-white">mail@connbx.com.br</a>
            </p>
            <p className="flex flex-wrap gap-x-5 gap-y-1">
              <Link href="/privacidade" className="hover:text-white">{t('footer.privacy')}</Link>
              <Link href="/seguranca" className="hover:text-white">{t('footer.security')}</Link>
            </p>
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

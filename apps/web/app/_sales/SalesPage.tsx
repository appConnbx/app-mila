import Link from 'next/link'
import type { ReactNode } from 'react'

/* =========================================================================
   Motor de página de vendas (LP para anúncios).
   - 100% server-rendered, sem JS de cliente (FAQ via <details>).
   - Idioma/segmento definidos pelo conteúdo (não pelo cookie de locale).
   - Conteúdo verdadeiro: sem promessas de resultado, sem depoimentos falsos.
     A seção de prova social só renderiza se `proof` for preenchido com
     depoimentos REAIS (compatível com políticas de anúncios Google/Meta).
   ========================================================================= */

export type SalesPlan = {
  name: string
  users: string
  priceMain: string
  priceUnit?: string
  priceSub?: string
  href: string
  cta: string
  featured?: boolean
  popular?: string
}

export type SalesContent = {
  locale: 'pt-BR' | 'en' | 'es'
  accent: 'brand' | 'orange'
  loginLabel: string

  badge: string
  headline: ReactNode
  subtitle: string
  ctaPrimary: string
  trustline: string
  heroBullets: string[]

  painKicker: string
  painTitle: string
  painSubtitle: string
  pains: { p: string; r: string }[]

  solKicker: string
  solTitle: string
  solDesc: string
  features: { t: string; d: string }[]

  howTitle: string
  howSub: string
  steps: { n: string; t: string; d: string }[]

  authTitle: string
  authBody: string[]
  authSignature: string

  proofTitle?: string
  proof?: { quote: string; who: string }[]

  plansKicker: string
  plansTitle: string
  plansSub: string
  plans: SalesPlan[]
  freeNote?: { text: string; cta: string; href: string }

  guaranteeTitle: string
  guaranteeBody: string

  faqTitle: string
  faqs: { q: string; a: string }[]

  finalTitle: string
  finalSub: string
  finalCta: string

  footerCompany: string
  footerDisclaimer: string
  privacyLabel: string
  termsLabel: string
  supportEmail: string
}

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

export function SalesPage({ c }: { c: SalesContent }) {
  // Cores de destaque conforme o segmento.
  const a =
    c.accent === 'orange'
      ? {
          text: 'text-orange-300',
          bg: 'bg-orange-500',
          bgHover: 'hover:bg-orange-400',
          ring: 'ring-orange-400/40',
          border: 'border-orange-400/50',
          soft: 'bg-orange-500/[0.06]',
          softBorder: 'border-orange-400/30',
          chipBg: 'bg-orange-500/15',
        }
      : {
          text: 'text-brand',
          bg: 'bg-brand',
          bgHover: 'hover:bg-brand-500',
          ring: 'ring-brand/40',
          border: 'border-brand/50',
          soft: 'bg-brand/[0.06]',
          softBorder: 'border-brand/30',
          chipBg: 'bg-brand/15',
        }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-200">
      {/* NAV enxuta — sem distrações (foco em conversão) */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-slate-950">M</span>
            <span className="text-lg font-bold tracking-tight text-white">MILA</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:inline-block">
              {c.loginLabel}
            </Link>
            <a href="#planos" className={`rounded-lg ${a.bg} px-4 py-2 text-sm font-semibold text-slate-950 transition ${a.bgHover}`}>
              {c.ctaPrimary}
            </a>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center lg:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-slate-300">
            <span className={`h-1.5 w-1.5 rounded-full ${a.bg}`} />
            {c.badge}
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-[1.07] tracking-tight text-white sm:text-5xl">
            {c.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">{c.subtitle}</p>
          <div className="mt-8 flex justify-center">
            <a href="#planos" className={`inline-flex items-center gap-2 rounded-xl ${a.bg} px-7 py-3.5 text-sm font-semibold text-slate-950 transition ${a.bgHover}`}>
              {c.ctaPrimary} <Arrow className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-500">{c.trustline}</p>
          <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-300">
            {c.heroBullets.map((b) => (
              <li key={b} className="inline-flex items-center gap-1.5">
                <Check className={`h-4 w-4 ${a.text}`} /> {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* DOR / AGITAÇÃO */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <p className={`text-sm font-semibold uppercase tracking-wider ${a.text}`}>{c.painKicker}</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-bold text-white">{c.painTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">{c.painSubtitle}</p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {c.pains.map((b) => (
            <div key={b.p} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-medium text-slate-400">{b.p}</p>
              <div className="mt-3 flex items-start gap-2">
                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${a.text}`} />
                <p className="text-sm font-medium text-slate-100">{b.r}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUÇÃO / FEATURES */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <p className={`text-sm font-semibold uppercase tracking-wider ${a.text}`}>{c.solKicker}</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-bold text-white">{c.solTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">{c.solDesc}</p>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {c.features.map((f) => (
            <div key={f.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${a.chipBg} ${a.text}`}>
                <Check className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">{f.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">{c.howTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">{c.howSub}</p>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {c.steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className={`text-2xl font-extrabold ${a.text}`}>{s.n}</span>
              <h3 className="mt-2 text-base font-semibold text-white">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AUTORIDADE / HISTÓRIA */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-white">{c.authTitle}</h2>
          <div className="mt-4 space-y-3 text-slate-300">
            {c.authBody.map((p, i) => (
              <p key={i} className="leading-relaxed">{p}</p>
            ))}
          </div>
          <p className={`mt-5 text-sm font-semibold ${a.text}`}>{c.authSignature}</p>
        </div>
      </section>

      {/* PROVA SOCIAL — só renderiza com depoimentos reais */}
      {c.proof && c.proof.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-center text-3xl font-bold text-white">{c.proofTitle}</h2>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {c.proof.map((t, i) => (
              <figure key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <blockquote className="text-sm leading-relaxed text-slate-200">“{t.quote}”</blockquote>
                <figcaption className="mt-3 text-xs font-medium text-slate-500">{t.who}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* PLANOS */}
      <section id="planos" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14">
        <div className="text-center">
          <p className={`text-sm font-semibold uppercase tracking-wider ${a.text}`}>{c.plansKicker}</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{c.plansTitle}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">{c.plansSub}</p>
        </div>
        <div className={`mt-9 grid gap-5 ${c.plans.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
          {c.plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border bg-white/[0.03] p-6 ${
                p.featured ? `${a.border} ring-2 ${a.ring}` : 'border-white/10'
              }`}
            >
              {p.featured && p.popular && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full ${a.bg} px-3 py-0.5 text-[11px] font-bold text-slate-950`}>
                  ⭐ {p.popular}
                </span>
              )}
              <p className="text-sm font-semibold text-white">{p.name}</p>
              <p className="text-xs text-slate-400">{p.users}</p>
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-white">
                  {p.priceMain}
                  {p.priceUnit && <span className="text-base font-medium text-slate-400">{p.priceUnit}</span>}
                </p>
                {p.priceSub && <p className="mt-0.5 text-xs text-slate-400">{p.priceSub}</p>}
              </div>
              <a
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className={`mt-5 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                  p.featured ? `${a.bg} text-slate-950 ${a.bgHover}` : 'border border-white/10 text-slate-200 hover:bg-white/5'
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        {c.freeNote && (
          <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-400">{c.freeNote.text}</p>
            <Link href={c.freeNote.href} className="shrink-0 rounded-lg border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10">
              {c.freeNote.cta}
            </Link>
          </div>
        )}
      </section>

      {/* GARANTIA */}
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className={`flex items-start gap-4 rounded-2xl border ${a.softBorder} ${a.soft} p-6`}>
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${a.chipBg} text-2xl`}>🛡️</span>
          <div>
            <p className="text-base font-semibold text-white">{c.guaranteeTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{c.guaranteeBody}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14">
        <h2 className="text-center text-3xl font-bold text-white">{c.faqTitle}</h2>
        <div className="mt-8 space-y-3">
          {c.faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-white">
                {f.q}
                <span className={`shrink-0 text-lg ${a.text} transition group-open:rotate-45`}>+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center sm:p-14">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold text-white sm:text-4xl">{c.finalTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">{c.finalSub}</p>
          <div className="mt-7 flex justify-center">
            <a href="#planos" className={`inline-flex items-center gap-2 rounded-xl ${a.bg} px-7 py-3.5 text-sm font-semibold text-slate-950 transition ${a.bgHover}`}>
              {c.finalCta} <Arrow className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-500">{c.trustline}</p>
        </div>
      </section>

      {/* FOOTER + COMPLIANCE */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-5xl space-y-3 px-4 py-10 text-xs text-slate-500">
          <p className="text-slate-400">{c.footerDisclaimer}</p>
          <p>{c.footerCompany}</p>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/privacidade" className="hover:text-white">{c.privacyLabel}</Link>
            <Link href="/seguranca" className="hover:text-white">{c.termsLabel}</Link>
            <a href={`mailto:${c.supportEmail}`} className="hover:text-white">{c.supportEmail}</a>
          </p>
        </div>
      </footer>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/language-switcher'
import type { Locale } from '@/i18n/config'

export const metadata: Metadata = {
  title: 'MILA — Indique e Ganhe (em breve)',
  description: 'Programa de afiliados do MILA. Indique e seja recompensado. Em breve.',
}

export default async function AffiliatesPage() {
  const t = await getTranslations('affiliatesPage')
  const locale = (await getLocale()) as Locale

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface text-slate-200">
      {/* glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-orange-500/10 blur-[120px]" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-slate-950">M</span>
          <span className="text-lg font-bold tracking-tight text-white">MILA</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher current={locale} />
          <Link href="/" className="text-sm font-medium text-slate-300 transition hover:text-white">
            {t('back')}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          {t('badge')}
        </span>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {t('title')}
          <span className="mt-2 block bg-gradient-to-r from-brand to-orange-400 bg-clip-text text-transparent">
            {t('titleAccent')}
          </span>
        </h1>

        <p className="mt-5 max-w-lg text-lg text-slate-400">{t('desc')}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
          >
            {t('ctaKnow')}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
          >
            {t('ctaApp')}
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-500">{t('construction')}</p>
      </main>
    </div>
  )
}

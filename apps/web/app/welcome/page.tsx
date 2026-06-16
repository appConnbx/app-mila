import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { Aurora } from '@/components/ui'

export const metadata = { title: 'Bem-vindo · appMila', robots: { index: false } }

function toLocale(lang?: string) {
  return lang === 'en' ? 'en' : lang === 'es' ? 'es' : lang === 'pt-BR' ? 'pt-BR' : null
}

export default async function BemVindoPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const { lang } = await searchParams
  const locale = toLocale(lang) ?? (await getLocale())
  const t = await getTranslations({ locale, namespace: 'access' })

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Aurora />
      <div className="glass glow-top w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-3xl">✓</div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{t('welcomeTitle')}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-300">{t('welcomeBody')}</p>
        <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-slate-500">{t('welcomeHint')}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
        >
          {t('welcomeLoginCta')}
        </Link>
      </div>
    </main>
  )
}

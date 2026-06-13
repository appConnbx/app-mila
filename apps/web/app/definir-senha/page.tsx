import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { Aurora } from '@/components/ui'
import { SetPasswordForm } from './_form'

export const metadata = { title: 'Criar senha · MILA', robots: { index: false } }

function toLocale(lang?: string) {
  return lang === 'en' ? 'en' : lang === 'es' ? 'es' : lang === 'pt-BR' ? 'pt-BR' : null
}

export default async function DefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; erro?: string }>
}) {
  const { lang, erro } = await searchParams
  const locale = toLocale(lang) ?? (await getLocale())
  const t = await getTranslations({ locale, namespace: 'access' })
  const langQs = lang ? `?lang=${encodeURIComponent(lang)}` : ''

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Aurora />
      <div className="glass glow-top w-full max-w-sm p-8">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">MILA</h1>
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-brand" />
        </div>

        {erro === 'link' ? (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">{t('setInvalidTitle')}</h2>
            <p className="mt-2 text-sm text-slate-400">{t('setInvalidBody')}</p>
            <Link
              href={`/recuperar${langQs}`}
              className="mt-5 inline-block w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
            >
              {t('setRequestNew')}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-white">{t('setTitle')}</h2>
              <p className="mt-1 text-sm text-slate-400">{t('setSubtitle')}</p>
            </div>
            <SetPasswordForm
              dict={{
                placeholder: t('setPlaceholder'),
                confirmPlaceholder: t('setConfirmPlaceholder'),
                mismatch: t('setMismatch'),
                short: t('setShort'),
                submit: t('setSubmit'),
                saving: t('setSaving'),
              }}
            />
          </>
        )}
      </div>
    </main>
  )
}

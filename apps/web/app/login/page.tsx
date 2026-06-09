import { getLocale, getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/language-switcher'
import type { Locale } from '@/i18n/config'
import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const t = await getTranslations('login')
  const locale = (await getLocale()) as Locale

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface-card p-8 shadow-card">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher current={locale} />
        </div>
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            MILA
          </h1>
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-brand" />
          <p className="mt-3 text-sm text-slate-400">
            {t('subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              {t('email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
          >
            {t('submit')}
          </button>
        </form>
      </div>
    </main>
  )
}

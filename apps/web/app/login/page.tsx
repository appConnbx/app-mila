import { getLocale, getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Field, fieldClasses, Aurora } from '@/components/ui'
import { PasswordInput } from '@/components/password-input'
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
    <main className="flex min-h-screen items-center justify-center p-4">
      <Aurora />
      <div className="glass glow-top w-full max-w-sm p-8">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher current={locale} />
        </div>
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">MILA</h1>
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-brand" />
          <p className="mt-3 text-sm text-slate-400">{t('subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form action={login} className="space-y-4">
          <Field label={t('email')} htmlFor="email">
            <input id="email" name="email" type="email" required autoComplete="email" className={fieldClasses} />
          </Field>
          <Field label={t('password')} htmlFor="password">
            <PasswordInput id="password" name="password" required autoComplete="current-password" className={fieldClasses} />
          </Field>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            {t('submit')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a href="/forgot-password" className="text-xs text-slate-500 transition hover:text-slate-300">
            {t('forgot')}
          </a>
        </div>
      </div>
    </main>
  )
}

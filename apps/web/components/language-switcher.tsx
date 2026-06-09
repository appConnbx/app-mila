'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { locales, localeLabels, LOCALE_COOKIE, type Locale } from '@/i18n/config'

/**
 * Troca de idioma sem prefixo de rota: grava o cookie `mila_locale`
 * e atualiza o servidor (router.refresh lê o novo idioma no próximo render).
 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    document.cookie = `${LOCALE_COOKIE}=${value};path=/;max-age=31536000;samesite=lax`
    startTransition(() => router.refresh())
  }

  return (
    <select
      aria-label="Idioma"
      value={current}
      onChange={onChange}
      disabled={pending}
      className="rounded-lg border border-surface-border bg-slate-900/60 px-2 py-1.5 text-sm text-slate-300 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-50"
    >
      {locales.map((l) => (
        <option key={l} value={l} className="bg-surface text-slate-200">
          {localeLabels[l]}
        </option>
      ))}
    </select>
  )
}

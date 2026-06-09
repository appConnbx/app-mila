export const locales = ['pt-BR', 'en', 'es'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'pt-BR'

/** Cookie que guarda o idioma escolhido (lido em i18n/request.ts). */
export const LOCALE_COOKIE = 'mila_locale'

export const localeLabels: Record<Locale, string> = {
  'pt-BR': 'Português',
  en: 'English',
  es: 'Español',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value)
}

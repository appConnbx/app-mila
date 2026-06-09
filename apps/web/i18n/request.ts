import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, isLocale, LOCALE_COOKIE } from './config'

/**
 * Resolve o idioma a partir do cookie `mila_locale` (sem prefixo de rota).
 * Padrão: pt-BR. Usado por getTranslations()/getLocale() nos componentes.
 */
export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get(LOCALE_COOKIE)?.value
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})

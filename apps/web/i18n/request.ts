import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { defaultLocale, isLocale, LOCALE_COOKIE } from './config'

/**
 * Idioma fixo por URL (para anúncios): /en e /es abrem a landing direto no
 * idioma, sem depender do cookie. /br-* e / seguem pt-BR. Usa o header
 * x-pathname setado pelo middleware (não há prefixo [locale] de rota).
 */
function localeFromPath(path: string | null) {
  if (!path) return undefined
  if (path === '/en' || path.startsWith('/en/') || path.startsWith('/en-')) return 'en'
  if (path === '/es' || path.startsWith('/es/') || path.startsWith('/es-')) return 'es'
  if (path === '/br' || path.startsWith('/br/') || path.startsWith('/br-')) return 'pt-BR'
  return undefined
}

/**
 * Ordem de resolução: locale explícito (getTranslations({ locale })) →
 * idioma da URL (/en, /es) → cookie mila_locale → padrão (pt-BR).
 */
export default getRequestConfig(async ({ locale: requested }) => {
  const hdrs = await headers()
  const pathLocale = localeFromPath(hdrs.get('x-pathname'))
  const store = await cookies()
  const cookieLocale = store.get(LOCALE_COOKIE)?.value
  const locale = isLocale(requested)
    ? requested
    : (pathLocale ?? (isLocale(cookieLocale) ? cookieLocale : defaultLocale))

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})

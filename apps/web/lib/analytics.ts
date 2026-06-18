// Fundação de medição (GA4, Google Ads, Meta Pixel, TikTok Pixel).
// INERTE até os IDs serem definidos por env (NEXT_PUBLIC_*): sem ID, nada
// carrega e o banner de consentimento não aparece — zero mudança no site.
// Quando os IDs forem configurados na Vercel + redeploy, ativa sozinho.

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? ''
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? '' // formato AW-XXXXXXXXX
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''
export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? ''

/** Há pelo menos um pixel configurado? Controla banner + carregamento. */
export const ANALYTICS_ENABLED = !!(GA4_ID || GOOGLE_ADS_ID || META_PIXEL_ID || TIKTOK_PIXEL_ID)

// Só rastreia páginas públicas de marketing — nunca o app autenticado nem /cbx.
const MARKETING_EXACT = new Set(['/', '/en', '/es', '/start', '/welcome', '/affiliates'])
const MARKETING_PREFIX = ['/br-', '/en-', '/es-', '/blog']
export function isMarketingPath(pathname: string): boolean {
  return MARKETING_EXACT.has(pathname) || MARKETING_PREFIX.some((p) => pathname.startsWith(p))
}

export const CONSENT_COOKIE = 'mila_consent'
export type Consent = 'granted' | 'denied'

export function getConsent(): Consent | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)mila_consent=(granted|denied)/)
  return (m?.[1] as Consent) ?? null
}

export function setConsent(v: Consent): void {
  // 180 dias; Lax (sem cross-site). Padrão privacy: "denied" não rastreia.
  document.cookie = `${CONSENT_COOKIE}=${v}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Dispara um evento de conversão nos pixels carregados (best-effort).
 * Use eventos padrão: 'Lead', 'begin_checkout', 'Purchase'.
 */
export function track(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  const w = window as any
  try { w.gtag?.('event', event, params ?? {}) } catch {}
  try { w.fbq?.('track', event, params ?? {}) } catch {}
  try { w.ttq?.track?.(event, params ?? {}) } catch {}
}

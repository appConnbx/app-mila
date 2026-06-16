import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { Aurora } from '@/components/ui'
import { SubmitButton } from '@/components/pending'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripeApi } from '@/lib/stripe/client'
import { priceId, STRIPE_PRICES_TEST, type MilaPlan } from '@/lib/stripe/catalog'
import { PLANS } from '@/lib/plans'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const metadata = { title: 'Assinar · appMila', robots: { index: false } }
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Label e preço internacional derivados da fonte única (lib/plans.ts).
const PLAN_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(PLANS).map(([k, v]) => [k, v.label]),
)
const PLAN_USD: Record<string, string> = Object.fromEntries(
  Object.entries(PLANS).map(([k, v]) => [k, `US$${v.usd}`]),
)
const VALID = new Set(Object.keys(STRIPE_PRICES_TEST))
const toLocale = (l?: string) => (l === 'en' ? 'en' : l === 'es' ? 'es' : l === 'pt-BR' ? 'pt-BR' : null)
const safeNext = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/')

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; next?: string; lang?: string; exists?: string; erro?: string }>
}) {
  const { plan = '', next, lang, exists, erro } = await searchParams
  if (!VALID.has(plan)) redirect('/')
  const locale = toLocale(lang) ?? (await getLocale())
  const t = await getTranslations({ locale, namespace: 'access' })
  const nx = safeNext(next)

  // Gate "bloquear e orientar": se o e-mail já tem login appMila, não cria conta nova.
  async function start(formData: FormData) {
    'use server'
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const p = String(formData.get('plan') ?? '')
    const ln = String(formData.get('lang') ?? '') || 'pt-BR'
    const nextPath = safeNext(String(formData.get('next') ?? '/'))
    const origin = process.env.APP_BASE_URL || 'https://www.appmila.co'
    const back = (q: string) => `/subscribe?plan=${encodeURIComponent(p)}&lang=${encodeURIComponent(ln)}&next=${encodeURIComponent(nextPath)}&${q}`
    if (!VALID.has(p) || !email) redirect(back('erro=1'))
    // Rate-limit por IP: cada tentativa abre sessão de checkout no Stripe.
    if (await rateLimit(`subscribe:${await clientIp()}`, { windowMs: 600_000, max: 8 })) redirect(back('erro=1'))

    const admin = createAdminClient() as unknown as { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: unknown }> }
    const { data: existingId } = await admin.rpc('auth_user_id_by_email', { p_email: email })
    if (existingId) redirect(back('exists=1'))

    let url: string | null = null
    try {
      const session = await stripeApi<{ url: string }>('POST', '/checkout/sessions', {
        mode: 'subscription',
        customer_email: email,
        'line_items[0][price]': priceId(p as MilaPlan),
        'line_items[0][quantity]': 1,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        success_url: `${origin}/welcome?lang=${ln}`,
        cancel_url: `${origin}${nextPath}?checkout=cancelado`,
        'metadata[mila_plan]': p,
        'metadata[mila_lang]': ln,
        'subscription_data[metadata][mila_plan]': p,
      })
      url = session.url
    } catch (e) {
      console.error('subscribe checkout', e instanceof Error ? e.message : e)
      redirect(back('erro=1'))
    }
    redirect(url!)
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Aurora />
      <div className="glass glow-top w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">appMila</h1>
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-brand" />
        </div>

        {exists ? (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">{t('subExistsTitle')}</h2>
            <p className="mt-2 text-sm text-slate-400">{t('subExistsBody')}</p>
            <Link href="/login" className="mt-5 inline-block w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
              {t('subLoginCta')}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 text-center">
              <h2 className="text-lg font-semibold text-white">{t('subTitle')}</h2>
              <p className="mt-1 text-sm text-brand">{t('subPlanLine', { plan: PLAN_LABEL[plan], price: PLAN_USD[plan] })}</p>
            </div>
            {erro && (
              <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{t('subErr')}</p>
            )}
            <form action={start} className="space-y-3">
              <input type="hidden" name="plan" value={plan} />
              <input type="hidden" name="lang" value={lang ?? locale} />
              <input type="hidden" name="next" value={nx} />
              <div>
                <label htmlFor="sub-email" className="mb-1 block text-sm text-slate-300">{t('subEmailLabel')}</label>
                <input
                  id="sub-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-brand/60"
                />
                <p className="mt-1 text-xs text-slate-500">{t('subEmailHint')}</p>
              </div>
              <SubmitButton className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
                {t('subSubmit')}
              </SubmitButton>
            </form>
          </>
        )}
      </div>
    </main>
  )
}

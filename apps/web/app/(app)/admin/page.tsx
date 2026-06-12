import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Badge, fieldClasses } from '@/components/ui'
import { SubmitButton } from '@/components/pending'
import { setLicense } from './actions'

type Row = {
  holding_id: string
  name: string
  kind: 'corporate' | 'family'
  holding_status: string
  plan_id: string | null
  plan_name: string | null
  seat_limit: number | null
  used: number | null
  is_unlimited: boolean
  sub_status: string | null
}

type Plan = {
  id: string
  name: string
  account_kind: 'corporate' | 'family'
  provider: string
  max_users: number | null
  price_cents: number | null
  currency: string
  slug: string
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const t = await getTranslations('admin')
  const { ok, err } = await searchParams
  const supabase = await createClient()
  const sb = supabase as unknown as {
    rpc: (n: string) => Promise<{ data: unknown }>
  }

  const { data: isAdmin } = (await sb.rpc('is_platform_admin')) as { data: boolean | null }
  if (!isAdmin) redirect('/dashboard')

  const [hRes, pRes] = await Promise.all([sb.rpc('admin_list_holdings'), sb.rpc('admin_list_plans')])
  const holdings = (hRes.data as Row[] | null) ?? []
  const plans = (pRes.data as Plan[] | null) ?? []

  const kindLabel = (k: string) => (k === 'family' ? t('kindFamily') : t('kindCorporate'))
  const planOption = (p: Plan) =>
    `${p.name} · ${kindLabel(p.account_kind)} ${p.max_users == null ? '(∞)' : `(${p.max_users})`}`

  const flash =
    ok === 'applied' ? { kind: 'ok' as const, text: t('applied') }
    : err === 'forbidden' ? { kind: 'err' as const, text: t('forbidden') }
    : err ? { kind: 'err' as const, text: t('forbidden') }
    : undefined

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight text-white">{t('title')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('desc')}</p>

      {flash && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            flash.kind === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {flash.text}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {holdings.map((h) => {
          const usage = h.is_unlimited ? `${h.used ?? 0} ${t('used')} · ${t('unlimited')}` : `${h.used ?? 0} / ${h.seat_limit ?? 0}`
          return (
            <section key={h.holding_id} className="glass p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{h.name}</h2>
                    <Badge variant="neutral">{kindLabel(h.kind)}</Badge>
                    {h.is_unlimited && <Badge variant="brand">VIP</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    <span className="text-slate-300">{h.plan_name ?? t('noPlan')}</span> · {usage}
                  </p>
                </div>
              </div>

              <form action={setLicense} className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/10 pt-4">
                <input type="hidden" name="holding_id" value={h.holding_id} />
                <div className="min-w-[240px] flex-1">
                  <label className="block text-[11px] uppercase tracking-wide text-slate-500">{t('plan')}</label>
                  <select name="plan_id" defaultValue={h.plan_id ?? ''} required className={`mt-1 ${fieldClasses}`}>
                    <option value="" disabled>{t('plan')}</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{planOption(p)}</option>
                    ))}
                  </select>
                </div>
                <div className="w-44">
                  <label className="block text-[11px] uppercase tracking-wide text-slate-500">{t('seatsOverride')}</label>
                  <input name="seats" type="number" min={1} placeholder="—" className={`mt-1 ${fieldClasses}`} />
                </div>
                <SubmitButton className="shrink-0 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
                  {t('apply')}
                </SubmitButton>
              </form>
              <p className="mt-2 text-xs text-slate-500">{t('seatsHint')}</p>
            </section>
          )
        })}
        {holdings.length === 0 && <p className="text-sm text-slate-500">{t('empty')}</p>}
      </div>
    </div>
  )
}

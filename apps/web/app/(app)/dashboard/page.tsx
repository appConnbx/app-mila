import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { enterInstance } from './actions'
import { computeStreak, type DailyPoint } from '@/lib/streak'

type Instance = {
  holding_id: string
  holding_name: string
  kind: 'corporate' | 'family'
  person_id: string
  role_title: string | null
}
type Overview = {
  counts: { pending: number; working: number; overdue: number; done: number }
  daily: DailyPoint[]
}

const KIND_CLS = {
  corporate: 'bg-brand/15 text-brand',
  family: 'bg-emerald-500/15 text-emerald-400',
} as const

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="glass p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const t = await getTranslations('home')
  const ti = await getTranslations('instances')
  const locale = await getLocale()
  const supabase = await createClient()

  const sb = supabase as unknown as {
    rpc: (name: string) => Promise<{ data: unknown; error: { message: string } | null }>
  }
  const [ovRes, instRes] = await Promise.all([sb.rpc('my_overview'), sb.rpc('my_instances')])
  const overview = (ovRes.data ?? { counts: { pending: 0, working: 0, overdue: 0, done: 0 }, daily: [] }) as Overview
  const instances = (instRes.data ?? []) as Instance[]

  const c = overview.counts
  const daily = overview.daily ?? []
  const streak = computeStreak(daily)
  const last14 = daily.slice(-14)
  const max = Math.max(1, ...last14.map((d) => d.completed))
  const dayLabel = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString(locale, { day: '2-digit' })

  return (
    <div className="space-y-8">
      {/* ---------- Dashboard pessoal ---------- */}
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-white">{t('title')}</h1>
        <p className="mt-1 text-sm text-slate-400">{t('subtitle')}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label={t('kpiPending')} value={c.pending} accent="text-sky-300" />
          <Kpi label={t('kpiWorking')} value={c.working} accent="text-amber-400" />
          <Kpi label={t('kpiOverdue')} value={c.overdue} accent="text-rose-400" />
          <Kpi label={t('kpiDone')} value={c.done} accent="text-emerald-400" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Gráfico de conclusões por dia (14 dias) */}
          <div className="glass p-5">
            <p className="text-sm font-medium text-slate-300">{t('completionsTitle')}</p>
            <div className="mt-4 flex h-32 items-end gap-1.5">
              {last14.map((d) => (
                <div key={d.day} className="flex h-full flex-1 flex-col justify-end gap-1" title={`${d.completed}`}>
                  {d.completed > 0 && (
                    <span className="text-center text-[10px] font-semibold text-brand">{d.completed}</span>
                  )}
                  <div
                    className={`w-full rounded-t ${d.completed > 0 ? 'bg-gradient-to-t from-brand-700/50 to-brand' : 'bg-white/5'}`}
                    style={{ height: d.completed > 0 ? `${Math.max(12, (d.completed / max) * 100)}%` : '3px' }}
                  />
                  <span className="text-center text-[10px] text-slate-600">{dayLabel(d.day)}</span>
                </div>
              ))}
              {last14.length === 0 && <p className="text-sm text-slate-500">{t('noData')}</p>}
            </div>
          </div>

          {/* Chama (streak) */}
          <div className="glass glow-top flex flex-col items-center justify-center p-5 text-center">
            <div className="text-5xl">🔥</div>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-white">{streak}</p>
            <p className="mt-1 text-sm font-medium text-slate-300">{t('streakLabel')}</p>
            <p className="mt-1 text-xs text-slate-500">{t('streakHint')}</p>
          </div>
        </div>
      </section>

      {/* ---------- Seleção de instância ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-white">{ti('title')}</h2>
        <p className="mt-1 text-sm text-slate-400">{ti('subtitle')}</p>

        {instRes.error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {ti('loadError', { message: instRes.error.message })}
          </div>
        )}

        {!instRes.error && instances.length === 0 && (
          <div className="mt-4 glass border-dashed p-10 text-center">
            <p className="text-slate-300">{ti('emptyTitle')}</p>
            <p className="mt-1 text-sm text-slate-500">{ti('emptyHint')}</p>
          </div>
        )}

        {instances.length > 0 && (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {instances.map((it) => {
              const kindCls = KIND_CLS[it.kind] ?? KIND_CLS.corporate
              const kindLabel = it.kind === 'family' ? ti('family') : ti('corporate')
              return (
                <li key={it.holding_id}>
                  <form action={enterInstance}>
                    <input type="hidden" name="holding_id" value={it.holding_id} />
                    <button type="submit" className="group glass w-full p-5 text-left transition hover:border-brand/60">
                      <div className="flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-lg font-bold text-brand">
                          {it.holding_name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${kindCls}`}>{kindLabel}</span>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-white">{it.holding_name}</h3>
                      <p className="mt-0.5 text-sm text-slate-400">{it.role_title ?? ti('member')}</p>
                      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition group-hover:opacity-100">
                        {ti('enter')}
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </div>
                    </button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

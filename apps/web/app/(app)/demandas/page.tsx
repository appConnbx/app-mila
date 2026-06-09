import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'

type Demand = {
  id: string
  title: string
  status: 'nova' | 'trabalhando' | 'finalizada'
  priority: 'baixa' | 'media' | 'alta'
  due_date: string | null
  responsible: { full_name: string } | null
  event: { name: string } | null
}

const STATUS_CLS = {
  nova: 'bg-blue-500/15 text-blue-300',
  trabalhando: 'bg-amber-500/15 text-amber-300',
  finalizada: 'bg-emerald-500/15 text-emerald-300',
} as const

const PRIORITY_CLS = {
  alta: 'text-red-400',
  media: 'text-amber-400',
  baixa: 'text-slate-400',
} as const

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-1 text-4xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}

export default async function DemandasPage() {
  const t = await getTranslations('demands')
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()

  const { data: holdingData } = await supabase
    .from('holdings')
    .select('name, kind')
    .eq('id', holdingId)
    .single()
  const holding = holdingData as unknown as { name: string; kind: string } | null

  const { data, error } = await supabase
    .from('demands')
    .select('id, title, status, priority, due_date, responsible:responsible_id(full_name), event:event_id(name)')
    .order('created_at', { ascending: false })

  const demands = (data ?? []) as unknown as Demand[]
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (d: Demand) => !!d.due_date && d.due_date < today && d.status !== 'finalizada'

  const total = demands.length
  const emAndamento = demands.filter((d) => d.status === 'trabalhando').length
  const concluidas = demands.filter((d) => d.status === 'finalizada').length
  const atrasadas = demands.filter(isOverdue).length

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{holding?.name ?? t('instanceFallback')}</p>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/demandas/nova"
            className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
          >
            {t('new')}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            {t('switchInstance')}
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={t('kpiTotal')} value={total} accent="text-white" />
        <Kpi label={t('kpiInProgress')} value={emAndamento} accent="text-amber-400" />
        <Kpi label={t('kpiOverdue')} value={atrasadas} accent="text-red-400" />
        <Kpi label={t('kpiDone')} value={concluidas} accent="text-emerald-400" />
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {t('loadError', { message: error.message })}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-card">
        <div className="grid grid-cols-12 gap-2 border-b border-surface-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          <div className="col-span-6">{t('colDemand')}</div>
          <div className="col-span-2">{t('colResponsible')}</div>
          <div className="col-span-2">{t('colDue')}</div>
          <div className="col-span-2 text-right">{t('colStatus')}</div>
        </div>

        {demands.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            {t('empty')}
          </div>
        )}

        {demands.map((d) => {
          const overdue = isOverdue(d)
          return (
            <div
              key={d.id}
              className="grid grid-cols-12 items-center gap-2 border-b border-surface-border/60 px-5 py-3 text-sm last:border-0 hover:bg-slate-800/30"
            >
              <div className="col-span-6">
                <p className="font-medium text-slate-100">{d.title}</p>
                <p className="mt-0.5 text-xs">
                  <span className={PRIORITY_CLS[d.priority]}>● {t(`priority.${d.priority}`)}</span>
                  {d.event && <span className="text-slate-500"> · {d.event.name}</span>}
                </p>
              </div>
              <div className="col-span-2 text-slate-300">
                {d.responsible?.full_name ?? '—'}
              </div>
              <div className={`col-span-2 ${overdue ? 'font-medium text-red-400' : 'text-slate-400'}`}>
                {d.due_date ? d.due_date.split('-').reverse().join('/') : '—'}
                {overdue && t('overdueSuffix')}
              </div>
              <div className="col-span-2 text-right">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLS[d.status]}`}>
                  {t(`status.${d.status}`)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

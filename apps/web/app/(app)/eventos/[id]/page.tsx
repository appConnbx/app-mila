import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { Badge, ProgressBar, EmptyState } from '@/components/ui'
import { closeEvent } from '../actions'

const STATUS_VARIANT = { nova: 'info', trabalhando: 'warning', finalizada: 'success' } as const

type EventFull = {
  id: string
  name: string
  status: 'aberto' | 'fechado'
  type: string
  event_date: string | null
  opened_at: string
  closed_at: string | null
  owner: { full_name: string } | null
}
type DemandRow = {
  id: string
  title: string
  status: 'nova' | 'trabalhando' | 'finalizada'
  responsible: { full_name: string } | null
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getTranslations('events')
  const td = await getTranslations('demands')
  const locale = await getLocale()
  const cookieStore = await cookies()
  if (!cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value) redirect('/dashboard')

  const supabase = await createClient()
  const { data: evData } = await supabase
    .from('events')
    .select('id, name, status, type, event_date, opened_at, closed_at, owner:owner_id(full_name)')
    .eq('id', id)
    .single()
  const ev = evData as unknown as EventFull | null
  if (!ev) notFound()

  const { data: demandsData } = await supabase
    .from('demands')
    .select('id, title, status, responsible:responsible_id(full_name)')
    .eq('event_id', id)
    .order('created_at', { ascending: false })
  const demands = (demandsData ?? []) as unknown as DemandRow[]

  const total = demands.length
  const done = demands.filter((d) => d.status === 'finalizada').length
  const pct = total ? Math.round((done / total) * 100) : 0
  const fmtDateTime = (iso: string | null) => {
    if (!iso) return '—'
    const dt = new Date(iso)
    return `${dt.toLocaleDateString(locale)} ${dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/eventos" className="text-sm text-slate-400 transition hover:text-white">← {t('back')}</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">{ev.name}</h1>
          <Badge variant={ev.status === 'aberto' ? 'warning' : 'neutral'}>
            {ev.status === 'aberto' ? t('statusOpen') : t('statusClosed')}
          </Badge>
        </div>
        {ev.status === 'aberto' && (
          <form action={closeEvent}>
            <input type="hidden" name="id" value={ev.id} />
            <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
              {t('close')}
            </button>
          </form>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <ProgressBar value={pct} className="h-2 flex-1" />
          <span className="text-sm font-medium text-white">{pct}%</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500 sm:grid-cols-4">
          <div><dt>{t('type')}</dt><dd className="text-slate-300">{t(`types.${ev.type}`)}</dd></div>
          <div><dt>{t('owner')}</dt><dd className="text-slate-300">{ev.owner?.full_name ?? '—'}</dd></div>
          <div><dt>{t('opened')}</dt><dd className="text-slate-300">{fmtDateTime(ev.opened_at)}</dd></div>
          <div><dt>{t('closed')}</dt><dd className="text-slate-300">{fmtDateTime(ev.closed_at)}</dd></div>
        </dl>
      </div>

      <h2 className="mt-6 text-lg font-semibold text-white">{t('linkedDemands')} ({total})</h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-card">
        {demands.map((d) => (
          <Link
            key={d.id}
            href={`/demandas/${d.id}`}
            className="flex items-center justify-between gap-2 border-b border-surface-border/60 px-5 py-3 text-sm last:border-0 transition hover:bg-slate-800/30"
          >
            <span className="font-medium text-slate-100">{d.title}</span>
            <span className="flex items-center gap-3">
              <span className="text-slate-400">{d.responsible?.full_name ?? '—'}</span>
              <Badge variant={STATUS_VARIANT[d.status]}>{td(`status.${d.status}`)}</Badge>
            </span>
          </Link>
        ))}
        {demands.length === 0 && <EmptyState>{t('noDemands')}</EmptyState>}
      </div>
    </div>
  )
}

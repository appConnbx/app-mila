import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { Button, Badge, EmptyState, Avatar, Tag, DeadlineBar } from '@/components/ui'

type Demand = {
  id: string
  title: string
  description: string | null
  status: 'nova' | 'trabalhando' | 'finalizada'
  priority: 'baixa' | 'media' | 'alta'
  due_date: string | null
  created_at: string
  tags: string[] | null
  responsible: { full_name: string } | null
  event: { name: string } | null
}

const STATUS_VARIANT = { nova: 'info', trabalhando: 'warning', finalizada: 'success' } as const

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="glass p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-1 text-4xl font-bold tracking-tight ${accent}`}>{value}</p>
    </div>
  )
}

export default async function DemandasPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const t = await getTranslations('demands')
  const locale = await getLocale()
  const { view } = await searchParams
  const archived = view === 'arquivadas'

  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()

  const { data: holdingData } = await supabase.from('holdings').select('name, kind').eq('id', holdingId).single()
  const holding = holdingData as unknown as { name: string; kind: string } | null

  const { data, error } = await supabase
    .from('demands')
    .select('id, title, description, status, priority, due_date, created_at, tags, responsible:responsible_id(full_name), event:event_id(name)')
    .order('created_at', { ascending: false })

  const all = (data ?? []) as unknown as Demand[]
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (d: Demand) => !!d.due_date && d.due_date < today && d.status !== 'finalizada'

  const total = all.length
  const emAndamento = all.filter((d) => d.status === 'trabalhando').length
  const concluidas = all.filter((d) => d.status === 'finalizada').length
  const atrasadas = all.filter(isOverdue).length

  const demands = archived ? all.filter((d) => d.status === 'finalizada') : all.filter((d) => d.status !== 'finalizada')

  const tabCls = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`

  // Rótulo do prazo (faltam/atrasada/hoje/sem prazo)
  const todayDate = new Date(today + 'T00:00:00')
  const deadlineLabel = (d: Demand) => {
    if (!d.due_date) return { text: t('noDue'), cls: 'text-slate-500' }
    const due = new Date(d.due_date + 'T00:00:00')
    const days = Math.round((due.getTime() - todayDate.getTime()) / 86400000)
    if (d.status !== 'finalizada' && days < 0) return { text: t('overdue', { days: Math.abs(days) }), cls: 'text-rose-400' }
    if (days === 0) return { text: t('dueToday'), cls: 'text-amber-400' }
    return { text: t('remaining', { days }), cls: days <= 2 ? 'text-amber-400' : 'text-slate-400' }
  }
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{holding?.name ?? t('instanceFallback')}</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t('title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button href="/demandas/nova" size="sm">{t('new')}</Button>
          <Button href="/dashboard" variant="secondary" size="sm">{t('switchInstance')}</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={t('kpiTotal')} value={total} accent="text-white" />
        <Kpi label={t('kpiInProgress')} value={emAndamento} accent="text-amber-400" />
        <Kpi label={t('kpiOverdue')} value={atrasadas} accent="text-rose-400" />
        <Kpi label={t('kpiDone')} value={concluidas} accent="text-emerald-400" />
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {t('loadError', { message: error.message })}
        </div>
      )}

      <div className="mt-6 flex items-center gap-1">
        <Link href="/demandas" className={tabCls(!archived)}>{t('tabActive')} ({total - concluidas})</Link>
        <Link href="/demandas?view=arquivadas" className={tabCls(archived)}>{t('tabArchived')} ({concluidas})</Link>
      </div>

      <div className="mt-4 space-y-3">
        {demands.length === 0 && (
          <div className="glass p-10 text-center">
            <EmptyState>{archived ? t('emptyArchived') : t('empty')}</EmptyState>
          </div>
        )}

        {demands.map((d) => {
          const overdue = isOverdue(d)
          const dl = deadlineLabel(d)
          const tags = d.tags ?? []
          return (
            <Link
              key={d.id}
              href={`/demandas/${d.id}`}
              className={`glass flex gap-4 p-5 transition hover:border-brand/40 ${overdue ? '!border-rose-500/30' : ''}`}
            >
              <Avatar name={d.responsible?.full_name ?? '?'} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-100">{d.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {d.responsible?.full_name ?? '—'} · {t('createdWord')} {fmtDate(d.created_at)}
                      {d.event && <span> · {d.event.name}</span>}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[d.status]} className="shrink-0">{t(`status.${d.status}`)}</Badge>
                </div>

                {d.description && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{d.description}</p>}

                {(tags.length > 0 || overdue) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {overdue && <Tag tone="danger">#{t('legendOverdue')}</Tag>}
                    {tags.map((tag) => (
                      <Tag key={tag} tone={tag === 'prioridade-alta' ? 'danger' : 'brand'}>#{tag}</Tag>
                    ))}
                    {tags.length > 0 && <Tag tone="auto">⚙ {t('autoTag')}</Tag>}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <span className="shrink-0 text-xs text-slate-500">
                    {t('dueWord')} {d.due_date ? fmtDate(d.due_date) : '—'}
                  </span>
                  <DeadlineBar createdAt={d.created_at} dueDate={d.due_date} done={d.status === 'finalizada'} />
                  <span className={`shrink-0 text-xs font-medium ${dl.cls}`}>{dl.text}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {demands.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> {t('legendOnTime')}</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> {t('legendNear')}</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /> {t('legendOverdue')}</span>
          <span>{t('legendHint')}</span>
        </div>
      )}
    </div>
  )
}

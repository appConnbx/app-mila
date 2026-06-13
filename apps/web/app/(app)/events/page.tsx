import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { Badge, ProgressBar, EmptyState } from '@/components/ui'
import { SubmitButton } from '@/components/pending'
import { createEvent } from './actions'

type EventRow = {
  id: string
  name: string
  status: 'aberto' | 'fechado'
  event_date: string | null
  owner_id: string
  owner: { full_name: string } | null
}
type DemandLite = { event_id: string | null; status: string }

const inputCls =
  'w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand'

export default async function EventosPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const t = await getTranslations('events')
  const locale = await getLocale()
  const { view } = await searchParams
  const showFinished = view === 'finalizados'

  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()

  // Família não tem eventos — bloqueia acesso direto à rota.
  const { data: hk } = await supabase.from('holdings').select('kind').eq('id', holdingId).single()
  if ((hk as unknown as { kind: string } | null)?.kind === 'family') redirect('/tasks')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: meData } = await supabase
    .from('people')
    .select('id')
    .eq('auth_user_id', user?.id ?? '')
    .eq('holding_id', holdingId)
    .limit(1)
  const me = (meData as unknown as { id: string }[] | null)?.[0]?.id

  const [eventsRes, demandsRes, partsRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, name, status, event_date, owner_id, owner:owner_id(full_name)')
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('opened_at', { ascending: false }),
    supabase.from('demands').select('event_id, status').not('event_id', 'is', null),
    supabase.from('event_participants').select('event_id').eq('person_id', me ?? ''),
  ])
  const allEvents = (eventsRes.data ?? []) as unknown as EventRow[]
  const demands = (demandsRes.data ?? []) as unknown as DemandLite[]
  const myParticipations = new Set(
    ((partsRes.data ?? []) as unknown as { event_id: string }[]).map((p) => p.event_id),
  )

  // Só eventos que EU criei ou de que participo.
  const events = allEvents.filter((e) => e.owner_id === me || myParticipations.has(e.id))

  const stats = (eventId: string) => {
    const ds = demands.filter((d) => d.event_id === eventId)
    const total = ds.length
    const done = ds.filter((d) => d.status === 'finalizada').length
    const pending = total - done
    return { total, done, pending, pct: total ? Math.round((done / total) * 100) : 0 }
  }
  // Finalizado = fechado E sem atividades pendentes. Ativo = o resto.
  const isFinished = (e: EventRow) => e.status === 'fechado' && stats(e.id).pending === 0
  const active = events.filter((e) => !isFinished(e))
  const finished = events.filter((e) => isFinished(e))
  const list = showFinished ? finished : active

  const fmtDate = (iso: string | null) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString(locale) : null)

  const card = (e: EventRow) => {
    const s = stats(e.id)
    const finishedNow = isFinished(e)
    const date = fmtDate(e.event_date)
    return (
      <Link key={e.id} href={`/events/${e.id}`} className="glass block p-5 transition hover:border-brand/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{e.name}</h3>
            {finishedNow ? (
              <Badge variant="success">{t('statusFinished')}</Badge>
            ) : e.status === 'fechado' ? (
              <Badge variant="info">{t('statusClosedPending')}</Badge>
            ) : (
              <Badge variant="warning">{t('statusActive')}</Badge>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {date ? `${date} · ` : ''}
            {t('owner')}: {e.owner?.full_name ?? '—'}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={s.pct} className="flex-1" />
          <span className="text-xs text-slate-400">{s.pct}% {t('completion')} · {s.done}/{s.total}</span>
        </div>
      </Link>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('subtitle')}</p>
        </div>
      </div>

      {/* Novo evento */}
      <div className="mt-6 rounded-2xl border border-brand/30 bg-brand/[0.06] p-5">
        <p className="text-sm font-medium text-white">{t('newEvent')}</p>
        <form action={createEvent} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input name="name" required placeholder={t('namePlaceholder')} className={inputCls} />
          <input
            name="event_date"
            type="date"
            aria-label={t('eventDateOptional')}
            className={`${inputCls} sm:max-w-[200px]`}
          />
          <SubmitButton className="shrink-0 rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
            {t('create')}
          </SubmitButton>
        </form>
      </div>

      {/* Filtro: Ativos / Finalizados (mesmo padrão das demandas) */}
      <div className="mt-6 inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
        <Link
          href="/events"
          className={`rounded-md px-3 py-1 text-sm transition ${!showFinished ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          {t('sectionActive')} ({active.length})
        </Link>
        <Link
          href="/events?view=finalizados"
          className={`rounded-md px-3 py-1 text-sm transition ${showFinished ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          {t('sectionFinished')} ({finished.length})
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {list.map(card)}
        {list.length === 0 && (
          <div className="glass p-10 text-center">
            <EmptyState>{showFinished ? t('emptyFinished') : t('empty')}</EmptyState>
          </div>
        )}
      </div>
    </div>
  )
}

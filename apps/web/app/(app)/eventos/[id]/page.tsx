import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { Avatar, Badge, ProgressBar, EmptyState } from '@/components/ui'
import { SubmitButton } from '@/components/pending'
import { ConfirmButton } from '@/components/confirm-button'
import { finalizeEvent, deleteEvent, addParticipant, removeParticipant, addEventDemand } from '../actions'
import { fmtDate as fmtDateTz, fmtDateTime as fmtDateTimeTz } from '@/lib/datetime'

const STATUS_VARIANT = { nova: 'info', trabalhando: 'warning', finalizada: 'success' } as const
const STATUS_RANK = { nova: 0, trabalhando: 0, finalizada: 1 } as const

type EventFull = {
  id: string
  name: string
  status: 'aberto' | 'fechado'
  event_date: string | null
  opened_at: string
  closed_at: string | null
  owner_id: string
  owner: { full_name: string } | null
}
type DemandRow = {
  id: string
  title: string
  status: 'nova' | 'trabalhando' | 'finalizada'
  created_at: string
  responsible: { full_name: string } | null
}
type Participant = { id: string; person_id: string; person: { full_name: string } | null }
type Person = { id: string; full_name: string }

const inputCls =
  'w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand'
const labelCls = 'block text-sm font-medium text-slate-300'

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; tab?: string }>
}) {
  const { id } = await params
  const { error, tab: tabRaw } = await searchParams
  const tab = tabRaw === 'participantes' ? 'participantes' : 'demandas'
  const t = await getTranslations('events')
  const td = await getTranslations('demands')
  const tn = await getTranslations('newDemand')
  const locale = await getLocale()
  const cookieStore = await cookies()
  if (!cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value) redirect('/dashboard')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: evData } = await supabase
    .from('events')
    .select('id, name, status, event_date, opened_at, closed_at, owner_id, owner:owner_id(full_name)')
    .eq('id', id)
    .single()
  const ev = evData as unknown as EventFull | null
  if (!ev) notFound()

  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)!.value
  const { data: meData } = await supabase
    .from('people')
    .select('id')
    .eq('auth_user_id', user?.id ?? '')
    .eq('holding_id', holdingId)
    .limit(1)
  const me = (meData as unknown as { id: string }[] | null)?.[0]?.id
  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: boolean | null }> }
  const { data: adminFlag } = await sb.rpc('is_holding_admin')
  const isHoldingAdmin = !!adminFlag
  const { data: hRow } = await supabase.from('holdings').select('timezone').eq('id', holdingId).single()
  const tz = (hRow as unknown as { timezone: string | null } | null)?.timezone ?? 'America/Sao_Paulo'

  const [demandsRes, partsRes, peopleRes] = await Promise.all([
    supabase
      .from('demands')
      .select('id, title, status, created_at, responsible:responsible_id(full_name)')
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('event_participants')
      .select('id, person_id, person:person_id(full_name)')
      .eq('event_id', id),
    supabase.from('people').select('id, full_name').eq('is_active', true).order('full_name'),
  ])
  const demandsRaw = (demandsRes.data ?? []) as unknown as DemandRow[]
  const participants = (partsRes.data ?? []) as unknown as Participant[]
  const allPeople = (peopleRes.data ?? []) as unknown as Person[]

  // Pendentes primeiro, depois concluídas (cada grupo já vem por created_at desc).
  const demands = [...demandsRaw].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])

  const amOwner = ev.owner_id === me
  const amMember = amOwner || participants.some((p) => p.person_id === me)
  const isOpen = ev.status === 'aberto'
  const canDeleteEvent = amOwner || isHoldingAdmin

  const total = demands.length
  const done = demands.filter((d) => d.status === 'finalizada').length
  const pending = total - done
  const pct = total ? Math.round((done / total) * 100) : 0
  const finishedForGood = ev.status === 'fechado' && pending === 0

  const participantPersonIds = new Set([ev.owner_id, ...participants.map((p) => p.person_id)])
  const addable = allPeople.filter((p) => !participantPersonIds.has(p.id))
  const responsibles: Person[] = [
    { id: ev.owner_id, full_name: ev.owner?.full_name ?? '—' },
    ...participants.map((p) => ({ id: p.person_id, full_name: p.person?.full_name ?? '—' })),
  ]

  const fmtDate = (iso: string | null) => fmtDateTz(iso, locale, tz)
  const fmtDateTime = (iso: string | null) => fmtDateTimeTz(iso, locale, tz)
  const tabHref = (tb: 'demandas' | 'participantes') => (tb === 'demandas' ? `/eventos/${ev.id}` : `/eventos/${ev.id}?tab=participantes`)

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/eventos" className="text-sm text-slate-400 transition hover:text-white">← {t('back')}</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">{ev.name}</h1>
          {finishedForGood ? (
            <Badge variant="success">{t('statusFinished')}</Badge>
          ) : ev.status === 'fechado' ? (
            <Badge variant="info">{t('statusClosedPending')}</Badge>
          ) : (
            <Badge variant="warning">{t('statusActive')}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {amOwner && isOpen && (
            <form action={finalizeEvent}>
              <input type="hidden" name="id" value={ev.id} />
              <SubmitButton className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
                {t('finalize')}
              </SubmitButton>
            </form>
          )}
          {canDeleteEvent && (
            <form action={deleteEvent}>
              <input type="hidden" name="id" value={ev.id} />
              <ConfirmButton
                message={t('confirmDelete')}
                className="rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
              >
                {t('delete')}
              </ConfirmButton>
            </form>
          )}
        </div>
      </div>

      <div className="mt-5 glass p-5">
        <div className="flex items-center gap-3">
          <ProgressBar value={pct} className="h-2 flex-1" />
          <span className="text-sm font-medium text-white">{pct}%</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500 sm:grid-cols-4">
          <div><dt>{t('date')}</dt><dd className="text-slate-300">{fmtDate(ev.event_date)}</dd></div>
          <div><dt>{t('owner')}</dt><dd className="text-slate-300">{ev.owner?.full_name ?? '—'}</dd></div>
          <div><dt>{t('opened')}</dt><dd className="text-slate-300">{fmtDateTime(ev.opened_at)}</dd></div>
          <div><dt>{t('closed')}</dt><dd className="text-slate-300">{fmtDateTime(ev.closed_at)}</dd></div>
        </dl>
        {amOwner && isOpen && <p className="mt-3 text-xs text-slate-500">{t('closeHint')}</p>}
      </div>

      {/* Abas: Demandas (prioridade) e Participantes */}
      <div className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <Link
          href={tabHref('demandas')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === 'demandas' ? 'bg-brand/15 text-brand' : 'text-slate-400 hover:text-white'}`}
        >
          {t('activities')} <span className="opacity-60">{pending}/{total}</span>
        </Link>
        <Link
          href={tabHref('participantes')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === 'participantes' ? 'bg-brand/15 text-brand' : 'text-slate-400 hover:text-white'}`}
        >
          {t('participants')} <span className="opacity-60">{participants.length}</span>
        </Link>
      </div>

      {tab === 'demandas' ? (
        <div className="mt-4">
          {error === 'activity' && (
            <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {tn('createError')}
            </div>
          )}

          {/* Nova atividade — só com evento aberto e sendo membro */}
          {isOpen && amMember && (
            <form action={addEventDemand} className="glass space-y-3 p-5">
              <input type="hidden" name="event_id" value={ev.id} />
              <div>
                <label htmlFor="title" className={labelCls}>{t('activityTitle')}</label>
                <input id="title" name="title" required placeholder={tn('demandPlaceholder')} className={`mt-1 ${inputCls}`} />
              </div>
              <div>
                <label htmlFor="description" className={labelCls}>{tn('description')}</label>
                <textarea id="description" name="description" rows={2} className={`mt-1 ${inputCls}`} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="responsible_id" className={labelCls}>{tn('responsible')}</label>
                  <select id="responsible_id" name="responsible_id" required defaultValue="" className={`mt-1 ${inputCls}`}>
                    <option value="" disabled>{tn('selectPlaceholder')}</option>
                    {responsibles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="priority" className={labelCls}>{tn('priority')}</label>
                  <select id="priority" name="priority" defaultValue="media" className={`mt-1 ${inputCls}`}>
                    <option value="baixa">{tn('priorityLow')}</option>
                    <option value="media">{tn('priorityMedium')}</option>
                    <option value="alta">{tn('priorityHigh')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="due_date" className={labelCls}>{tn('due')}</label>
                  <input id="due_date" name="due_date" type="date" className={`mt-1 ${inputCls}`} />
                </div>
              </div>
              <div className="flex justify-end">
                <SubmitButton className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
                  {t('addActivity')}
                </SubmitButton>
              </div>
            </form>
          )}

          <div className="mt-3 glass overflow-hidden p-0">
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
      ) : (
        <div className="mt-4 glass p-5">
          <ul className="space-y-2">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/40 px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-slate-100">
                  <Avatar name={p.person?.full_name ?? '—'} size="sm" />
                  {p.person?.full_name ?? '—'}
                </span>
                {amOwner && (
                  <form action={removeParticipant}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="event_id" value={ev.id} />
                    <SubmitButton className="text-xs text-slate-500 transition hover:text-red-400">
                      {t('removeParticipant')}
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
            {participants.length === 0 && <li className="text-sm text-slate-500">{t('noParticipants')}</li>}
          </ul>
          {amOwner && addable.length > 0 && (
            <form action={addParticipant} className="mt-3 flex gap-2 border-t border-surface-border pt-4">
              <input type="hidden" name="event_id" value={ev.id} />
              <select name="person_id" required defaultValue="" className={inputCls}>
                <option value="" disabled>{t('selectPerson')}</option>
                {addable.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
              <SubmitButton className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
                {t('addParticipant')}
              </SubmitButton>
            </form>
          )}
          {!amOwner && <p className="mt-3 text-xs text-slate-500">{t('onlyOwnerManages')}</p>}
        </div>
      )}
    </div>
  )
}

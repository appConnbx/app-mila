import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { Badge } from '@/components/ui'
import { SubmitButton } from '@/components/pending'
import { ConfirmButton } from '@/components/confirm-button'
import { setDemandStatus, addObservation, deleteDemand } from '../actions'
import { fmtDate, fmtDateTime } from '@/lib/datetime'

const STATUS_VARIANT = { nova: 'info', trabalhando: 'warning', finalizada: 'success' } as const

type Demand = {
  id: string
  title: string
  description: string | null
  status: 'nova' | 'trabalhando' | 'finalizada'
  priority: 'baixa' | 'media' | 'alta'
  due_date: string | null
  created_at: string
  channel: string
  responsible_id: string
  origin_id: string
  event_id: string | null
  visibility: 'private' | 'public'
  responsible: { full_name: string } | null
  origin: { full_name: string } | null
  event: { name: string } | null
}
type Person = { id: string; full_name: string }
type Obs = { id: string; body: string; created_at: string; author: { full_name: string } | null }
type Hist = { id: string; field_changed: string; old_value: string | null; new_value: string | null; created_at: string; changed_by: string | null }

const STATUSES = ['nova', 'trabalhando', 'finalizada'] as const
const inputCls =
  'mt-1 w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand'

export default async function DemandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getTranslations('demandDetail')
  const td = await getTranslations('demands')
  const locale = await getLocale()
  const cookieStore = await cookies()
  if (!cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value) redirect('/dashboard')

  const supabase = await createClient()
  const { data: demandData } = await supabase
    .from('demands')
    .select('id, title, description, status, priority, due_date, created_at, channel, responsible_id, origin_id, event_id, visibility, responsible:responsible_id(full_name), origin:origin_id(full_name), event:event_id(name)')
    .eq('id', id)
    .single()
  const d = demandData as unknown as Demand | null
  if (!d) notFound()

  // Quem sou eu nesta instância + admin? (controla exclusão) + fuso da instância.
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)!.value
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: boolean | null }> }
  const [meRes, hRes, adminRes] = await Promise.all([
    supabase.from('people').select('id').eq('auth_user_id', user?.id ?? '').eq('holding_id', holdingId).limit(1),
    supabase.from('holdings').select('timezone').eq('id', holdingId).single(),
    sb.rpc('is_holding_admin'),
  ])
  const me = (meRes.data as unknown as { id: string }[] | null)?.[0]?.id
  const tz = (hRes.data as unknown as { timezone: string | null } | null)?.timezone ?? 'America/Sao_Paulo'
  const canDelete = d.origin_id === me || !!adminRes.data

  const [peopleRes, obsRes, histRes] = await Promise.all([
    supabase.from('people').select('id, full_name').order('full_name'),
    supabase.from('demand_observations').select('id, body, created_at, author:author_id(full_name)').eq('demand_id', id).order('created_at', { ascending: false }),
    supabase.from('demand_history').select('id, field_changed, old_value, new_value, created_at, changed_by').eq('demand_id', id).order('created_at', { ascending: false }),
  ])
  const people = (peopleRes.data ?? []) as unknown as Person[]
  const observations = (obsRes.data ?? []) as unknown as Obs[]
  const history = (histRes.data ?? []) as unknown as Hist[]

  const nameOf = (pid: string | null) => (pid ? people.find((p) => p.id === pid)?.full_name ?? '—' : '—')
  const visLabel = d.visibility === 'public' ? t('visPublic') : t('visPrivate')
  const fieldLabel = (f: string) =>
    ({ status: t('fStatus'), responsible_id: t('fResponsible'), priority: t('fPriority'), due_date: t('fDue') }[f] ?? f)
  const renderVal = (f: string, v: string | null) => {
    if (v === null || v === '') return '—'
    if (f === 'status') return td(`status.${v}`)
    if (f === 'priority') return td(`priority.${v}`)
    if (f === 'responsible_id') return nameOf(v)
    if (f === 'due_date') return fmtDate(v, locale, tz)
    return v
  }

  const PropCard = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-surface-border bg-slate-900/40 px-4 py-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-slate-100" title={value}>{value}</dd>
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/tasks" className="text-sm text-slate-400 transition hover:text-white">← {t('back')}</Link>

      {/* Cabeçalho full-width: título + status + descrição + propriedades (somente leitura) */}
      <section className="mt-3 glass p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{d.title}</h1>
            <Badge variant={STATUS_VARIANT[d.status]}>{td(`status.${d.status}`)}</Badge>
          </div>
          {canDelete && (
            <form action={deleteDemand}>
              <input type="hidden" name="id" value={d.id} />
              <ConfirmButton
                message={t('confirmDelete')}
                className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
              >
                {t('delete')}
              </ConfirmButton>
            </form>
          )}
        </div>

        {/* Mudança rápida de status (continua permitida após a criação) */}
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <form action={setDemandStatus} key={s}>
              <input type="hidden" name="id" value={d.id} />
              <input type="hidden" name="status" value={s} />
              <SubmitButton
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  d.status === s ? 'bg-brand text-slate-950' : 'border border-surface-border text-slate-300 hover:bg-slate-800'
                }`}
              >
                {td(`status.${s}`)}
              </SubmitButton>
            </form>
          ))}
        </div>

        {/* Propriedades em cards — harmônico e usando a largura toda */}
        <h2 className="mt-5 border-t border-surface-border pt-5 text-sm font-medium text-slate-400">{t('properties')}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PropCard label={t('fResponsible')} value={d.responsible?.full_name ?? '—'} />
          <PropCard label={t('fPriority')} value={td(`priority.${d.priority}`)} />
          <PropCard label={t('fDue')} value={fmtDate(d.due_date, locale, tz)} />
          <PropCard label={t('fVisibility')} value={visLabel} />
        </div>
        {/* Metadados secundários, discretos em linha */}
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          <div className="flex gap-1.5"><dt>{t('origin')}:</dt><dd className="text-slate-400">{d.origin?.full_name ?? '—'}</dd></div>
          <div className="flex gap-1.5"><dt>{t('event')}:</dt><dd className="text-slate-400">{d.event?.name ?? '—'}</dd></div>
          <div className="flex gap-1.5"><dt>{t('created')}:</dt><dd className="text-slate-400">{fmtDateTime(d.created_at, locale, tz)}</dd></div>
        </dl>
        {/* Descrição em largura total — sem buraco quando vazia/curta */}
        <div className="mt-5 border-t border-surface-border pt-5">
          <h2 className="text-sm font-medium text-slate-400">{t('description')}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{d.description || t('noDescription')}</p>
        </div>
      </section>

      {/* Observações (wide) + Histórico */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-3">
        <section className="glass p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">{t('observations')}</h2>
          <form action={addObservation} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="demand_id" value={d.id} />
            <textarea name="body" rows={2} required placeholder={t('obsPlaceholder')} className={inputCls} />
            <SubmitButton className="self-end rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
              {t('send')}
            </SubmitButton>
          </form>
          <ul className="mt-4 space-y-3">
            {observations.map((o) => (
              <li key={o.id} className="rounded-lg bg-slate-900/40 px-3 py-2">
                <p className="text-sm text-slate-200">{o.body}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {o.author?.full_name ?? '—'} · {fmtDateTime(o.created_at, locale, tz)}
                </p>
              </li>
            ))}
            {observations.length === 0 && <li className="text-sm text-slate-500">{t('noObservations')}</li>}
          </ul>
        </section>

        <section className="glass p-5">
          <h2 className="text-lg font-semibold text-white">{t('history')}</h2>
          <ul className="mt-3 space-y-3">
            {history.map((h) => (
              <li key={h.id} className="text-xs">
                <p className="text-slate-300">
                  <span className="font-medium text-slate-200">{fieldLabel(h.field_changed)}</span>: {renderVal(h.field_changed, h.old_value)} → {renderVal(h.field_changed, h.new_value)}
                </p>
                <p className="text-slate-500">{nameOf(h.changed_by)} · {fmtDateTime(h.created_at, locale, tz)}</p>
              </li>
            ))}
            {history.length === 0 && <li className="text-sm text-slate-500">{t('noHistory')}</li>}
          </ul>
        </section>
      </div>
    </div>
  )
}

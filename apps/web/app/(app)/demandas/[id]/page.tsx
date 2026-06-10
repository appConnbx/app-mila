import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { Badge } from '@/components/ui'
import { SubmitButton } from '@/components/pending'
import { updateDemand, setDemandStatus, addObservation } from '../actions'

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

  const [peopleRes, obsRes, histRes] = await Promise.all([
    supabase.from('people').select('id, full_name').eq('is_active', true).order('full_name'),
    supabase.from('demand_observations').select('id, body, created_at, author:author_id(full_name)').eq('demand_id', id).order('created_at', { ascending: false }),
    supabase.from('demand_history').select('id, field_changed, old_value, new_value, created_at, changed_by').eq('demand_id', id).order('created_at', { ascending: false }),
  ])
  const people = (peopleRes.data ?? []) as unknown as Person[]
  const observations = (obsRes.data ?? []) as unknown as Obs[]
  const history = (histRes.data ?? []) as unknown as Hist[]

  const nameOf = (pid: string | null) => (pid ? people.find((p) => p.id === pid)?.full_name ?? '—' : '—')
  const fmtDate = (iso: string | null) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—')
  const fmtDateTime = (iso: string) => {
    const dt = new Date(iso)
    return `${dt.toLocaleDateString(locale)} ${dt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
  }
  const fieldLabel = (f: string) =>
    ({ status: t('fStatus'), responsible_id: t('fResponsible'), priority: t('fPriority'), due_date: t('fDue') }[f] ?? f)
  const renderVal = (f: string, v: string | null) => {
    if (v === null || v === '') return '—'
    if (f === 'status') return td(`status.${v}`)
    if (f === 'priority') return td(`priority.${v}`)
    if (f === 'responsible_id') return nameOf(v)
    if (f === 'due_date') return fmtDate(v)
    return v
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/demandas" className="text-sm text-slate-400 transition hover:text-white">← {t('back')}</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">{d.title}</h1>
        <Badge variant={STATUS_VARIANT[d.status]}>{td(`status.${d.status}`)}</Badge>
      </div>

      {/* Mudança rápida de status */}
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

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-3">
        {/* Esquerda: descrição + observações */}
        <div className="space-y-5 lg:col-span-2">
          <section className="glass p-5">
            <h2 className="text-sm font-medium text-slate-400">{t('description')}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{d.description || t('noDescription')}</p>
          </section>

          <section className="glass p-5">
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
                    {o.author?.full_name ?? '—'} · {fmtDateTime(o.created_at)}
                  </p>
                </li>
              ))}
              {observations.length === 0 && <li className="text-sm text-slate-500">{t('noObservations')}</li>}
            </ul>
          </section>
        </div>

        {/* Direita: propriedades (editar) + histórico */}
        <div className="space-y-5">
          <form action={updateDemand} className="glass p-5">
            <input type="hidden" name="id" value={d.id} />
            <h2 className="text-lg font-semibold text-white">{t('properties')}</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-400">{t('fResponsible')}</label>
                <select name="responsible_id" defaultValue={d.responsible_id} className={inputCls}>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">{t('fPriority')}</label>
                <select name="priority" defaultValue={d.priority} className={inputCls}>
                  <option value="baixa">{td('priority.baixa')}</option>
                  <option value="media">{td('priority.media')}</option>
                  <option value="alta">{td('priority.alta')}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">{t('fDue')}</label>
                <input type="date" name="due_date" defaultValue={d.due_date ?? ''} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-slate-400">{t('fVisibility')}</label>
                <select name="visibility" defaultValue={d.visibility} className={inputCls}>
                  <option value="private">{t('visPrivate')}</option>
                  <option value="public">{t('visPublic')}</option>
                </select>
              </div>
              <SubmitButton className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
                {t('save')}
              </SubmitButton>
            </div>
            <dl className="mt-4 space-y-1.5 border-t border-surface-border pt-3 text-xs text-slate-500">
              <div className="flex justify-between"><dt>{t('origin')}</dt><dd className="text-slate-300">{d.origin?.full_name ?? '—'}</dd></div>
              <div className="flex justify-between"><dt>{t('event')}</dt><dd className="text-slate-300">{d.event?.name ?? '—'}</dd></div>
              <div className="flex justify-between"><dt>{t('created')}</dt><dd className="text-slate-300">{fmtDateTime(d.created_at)}</dd></div>
            </dl>
          </form>

          <section className="glass p-5">
            <h2 className="text-lg font-semibold text-white">{t('history')}</h2>
            <ul className="mt-3 space-y-3">
              {history.map((h) => (
                <li key={h.id} className="text-xs">
                  <p className="text-slate-300">
                    <span className="font-medium text-slate-200">{fieldLabel(h.field_changed)}</span>: {renderVal(h.field_changed, h.old_value)} → {renderVal(h.field_changed, h.new_value)}
                  </p>
                  <p className="text-slate-500">{nameOf(h.changed_by)} · {fmtDateTime(h.created_at)}</p>
                </li>
              ))}
              {history.length === 0 && <li className="text-sm text-slate-500">{t('noHistory')}</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

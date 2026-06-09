import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { openEvent, closeEvent } from './actions'

type EventRow = {
  id: string
  name: string
  status: 'aberto' | 'fechado'
  type: string
  event_date: string | null
  opened_at: string
}
type DemandLite = { event_id: string | null; status: string }

const EVENT_TYPES = ['reuniao', 'ata', 'comite', 'follow_up', 'alinhamento', 'plano_acao', 'diagnostico', 'outro'] as const

const inputCls =
  'w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand'

export default async function EventosPage() {
  const t = await getTranslations('events')
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Pessoa atual + sessão ativa
  const { data: meData } = await supabase
    .from('people')
    .select('id, active_event_id')
    .eq('auth_user_id', user?.id ?? '')
    .eq('holding_id', holdingId)
    .limit(1)
  const me = (meData as unknown as { id: string; active_event_id: string | null }[] | null)?.[0]

  const [eventsRes, demandsRes] = await Promise.all([
    supabase.from('events').select('id, name, status, type, event_date, opened_at').order('opened_at', { ascending: false }),
    supabase.from('demands').select('event_id, status'),
  ])
  const events = (eventsRes.data ?? []) as unknown as EventRow[]
  const demands = (demandsRes.data ?? []) as unknown as DemandLite[]

  const stats = (eventId: string) => {
    const ds = demands.filter((d) => d.event_id === eventId)
    const total = ds.length
    const done = ds.filter((d) => d.status === 'finalizada').length
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  }

  const activeEvent = me?.active_event_id ? events.find((e) => e.id === me.active_event_id) : undefined

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('subtitle')}</p>
        </div>
      </div>

      {/* Sessão ativa */}
      <div className="mt-6 rounded-2xl border border-brand/30 bg-brand/[0.06] p-5">
        {activeEvent ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-brand">{t('activeSession')}</p>
              <p className="mt-1 text-lg font-semibold text-white">{activeEvent.name}</p>
              <p className="text-xs text-slate-400">{t('activeHint')}</p>
            </div>
            <form action={closeEvent}>
              <input type="hidden" name="id" value={activeEvent.id} />
              <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
                {t('close')}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-300">{t('noActive')}</p>
            <form action={openEvent} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input name="name" required placeholder={t('namePlaceholder')} className={inputCls} />
              <select name="type" defaultValue="follow_up" className={`${inputCls} sm:max-w-[180px]`}>
                {EVENT_TYPES.map((ty) => (
                  <option key={ty} value={ty}>{t(`types.${ty}`)}</option>
                ))}
              </select>
              <button type="submit" className="shrink-0 rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
                {t('open')}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Lista de eventos */}
      <div className="mt-6 space-y-3">
        {events.map((e) => {
          const s = stats(e.id)
          return (
            <Link
              key={e.id}
              href={`/eventos/${e.id}`}
              className="block rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card transition hover:border-brand/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{e.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${e.status === 'aberto' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-600/30 text-slate-400'}`}>
                    {e.status === 'aberto' ? t('statusOpen') : t('statusClosed')}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{t(`types.${e.type}`)}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-xs text-slate-400">{s.pct}% {t('completion')} · {s.done}/{s.total}</span>
              </div>
            </Link>
          )
        })}
        {events.length === 0 && (
          <div className="rounded-2xl border border-surface-border bg-surface-card px-5 py-10 text-center text-sm text-slate-500">
            {t('empty')}
          </div>
        )}
      </div>
    </div>
  )
}

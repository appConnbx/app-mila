import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { createDemand } from '../actions'

type Person = { id: string; full_name: string }
type Event = { id: string; name: string }

const inputCls =
  'mt-1 w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand'
const labelCls = 'block text-sm font-medium text-slate-300'

export default async function NovaDemandaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const t = await getTranslations('newDemand')
  const { error } = await searchParams
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const [peopleRes, eventsRes] = await Promise.all([
    supabase.from('people').select('id, full_name').eq('is_active', true).order('full_name'),
    supabase.from('events').select('id, name').eq('status', 'aberto').order('opened_at', { ascending: false }),
  ])
  const people = (peopleRes.data ?? []) as unknown as Person[]
  const events = (eventsRes.data ?? []) as unknown as Event[]

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <Link
          href="/demandas"
          className="rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          {t('back')}
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {t('createError')}
        </div>
      )}

      <form
        action={createDemand}
        className="mt-6 glass space-y-4 p-6"
      >
        <div>
          <label htmlFor="title" className={labelCls}>{t('demand')}</label>
          <input id="title" name="title" required placeholder={t('demandPlaceholder')} className={inputCls} />
        </div>

        <div>
          <label htmlFor="description" className={labelCls}>{t('description')}</label>
          <textarea id="description" name="description" rows={3} className={inputCls} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="responsible_id" className={labelCls}>{t('responsible')}</label>
            <select id="responsible_id" name="responsible_id" required defaultValue="" className={inputCls}>
              <option value="" disabled>{t('selectPlaceholder')}</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className={labelCls}>{t('priority')}</label>
            <select id="priority" name="priority" defaultValue="media" className={inputCls}>
              <option value="baixa">{t('priorityLow')}</option>
              <option value="media">{t('priorityMedium')}</option>
              <option value="alta">{t('priorityHigh')}</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="due_date" className={labelCls}>{t('due')}</label>
            <input id="due_date" name="due_date" type="date" className={inputCls} />
          </div>
          <div>
            <label htmlFor="event_id" className={labelCls}>{t('event')}</label>
            <select id="event_id" name="event_id" defaultValue="" className={inputCls}>
              <option value="">{t('eventNone')}</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/demandas" className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800">
            {t('cancel')}
          </Link>
          <button type="submit" className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
            {t('submit')}
          </button>
        </div>
      </form>
    </div>
  )
}

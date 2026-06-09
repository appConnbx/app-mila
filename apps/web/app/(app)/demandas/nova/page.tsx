import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { createDemand } from '../actions'

type Person = { id: string; full_name: string }
type Event = { id: string; name: string }

const inputCls =
  'mt-1 w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand'
const labelCls = 'block text-sm font-medium text-slate-300'

export default async function NovaDemandaPage() {
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
        <h1 className="text-2xl font-bold text-white">Nova demanda</h1>
        <Link
          href="/demandas"
          className="rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          Voltar
        </Link>
      </div>

      <form
        action={createDemand}
        className="mt-6 space-y-4 rounded-2xl border border-surface-border bg-surface-card p-6 shadow-card"
      >
        <div>
          <label htmlFor="title" className={labelCls}>Demanda *</label>
          <input id="title" name="title" required placeholder="Ex.: Validar chamados pendentes" className={inputCls} />
        </div>

        <div>
          <label htmlFor="description" className={labelCls}>Descrição (opcional)</label>
          <textarea id="description" name="description" rows={3} className={inputCls} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="responsible_id" className={labelCls}>Responsável *</label>
            <select id="responsible_id" name="responsible_id" required defaultValue="" className={inputCls}>
              <option value="" disabled>Selecione…</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className={labelCls}>Prioridade</label>
            <select id="priority" name="priority" defaultValue="media" className={inputCls}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="due_date" className={labelCls}>Prazo (opcional)</label>
            <input id="due_date" name="due_date" type="date" className={inputCls} />
          </div>
          <div>
            <label htmlFor="event_id" className={labelCls}>Evento (opcional)</label>
            <select id="event_id" name="event_id" defaultValue="" className={inputCls}>
              <option value="">Nenhum (avulsa)</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/demandas" className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800">
            Cancelar
          </Link>
          <button type="submit" className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
            Criar demanda
          </button>
        </div>
      </form>
    </div>
  )
}

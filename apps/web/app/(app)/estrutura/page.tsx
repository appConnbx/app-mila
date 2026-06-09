import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { createOrganization, createArea, createTeam, createPerson } from './actions'

type Org = { id: string; name: string }
type Area = { id: string; name: string; organization_id: string }
type Team = { id: string; name: string; area_id: string }
type Person = { id: string; full_name: string; role_title: string | null; organization_id: string }

const inputCls =
  'w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand'
const btnCls =
  'rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export default async function EstruturaPage() {
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const [orgsRes, areasRes, teamsRes, peopleRes] = await Promise.all([
    supabase.from('organizations').select('id, name').order('name'),
    supabase.from('areas').select('id, name, organization_id').order('name'),
    supabase.from('teams').select('id, name, area_id').order('name'),
    supabase.from('people').select('id, full_name, role_title, organization_id').order('full_name'),
  ])

  const orgs = (orgsRes.data ?? []) as unknown as Org[]
  const areas = (areasRes.data ?? []) as unknown as Area[]
  const teams = (teamsRes.data ?? []) as unknown as Team[]
  const people = (peopleRes.data ?? []) as unknown as Person[]

  const orgName = (id: string) => orgs.find((o) => o.id === id)?.name ?? '—'
  const areaName = (id: string) => areas.find((a) => a.id === id)?.name ?? '—'

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Estrutura</h1>
        <span className="text-sm text-slate-400">
          {orgs.length} org · {areas.length} áreas · {teams.length} equipes · {people.length} pessoas
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* ORGANIZAÇÕES */}
        <Card title="Organizações">
          <ul className="space-y-1.5">
            {orgs.map((o) => (
              <li key={o.id} className="rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200">
                {o.name}
              </li>
            ))}
            {orgs.length === 0 && <li className="text-sm text-slate-500">Nenhuma ainda.</li>}
          </ul>
          <form action={createOrganization} className="flex gap-2">
            <input name="name" placeholder="Nova organização" required className={inputCls} />
            <button type="submit" className={btnCls}>Add</button>
          </form>
        </Card>

        {/* ÁREAS */}
        <Card title="Áreas">
          <ul className="space-y-1.5">
            {areas.map((a) => (
              <li key={a.id} className="rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200">
                {a.name} <span className="text-slate-500">· {orgName(a.organization_id)}</span>
              </li>
            ))}
            {areas.length === 0 && <li className="text-sm text-slate-500">Nenhuma ainda.</li>}
          </ul>
          <form action={createArea} className="space-y-2">
            <select name="organization_id" required className={inputCls} defaultValue="">
              <option value="" disabled>Selecione a organização…</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input name="name" placeholder="Nova área" required className={inputCls} />
              <button type="submit" className={btnCls}>Add</button>
            </div>
          </form>
        </Card>

        {/* EQUIPES */}
        <Card title="Equipes">
          <ul className="space-y-1.5">
            {teams.map((t) => (
              <li key={t.id} className="rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200">
                {t.name} <span className="text-slate-500">· {areaName(t.area_id)}</span>
              </li>
            ))}
            {teams.length === 0 && <li className="text-sm text-slate-500">Nenhuma ainda.</li>}
          </ul>
          <form action={createTeam} className="space-y-2">
            <select name="area_id" required className={inputCls} defaultValue="">
              <option value="" disabled>Selecione a área…</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input name="name" placeholder="Nova equipe" required className={inputCls} />
              <button type="submit" className={btnCls}>Add</button>
            </div>
          </form>
        </Card>

        {/* PESSOAS */}
        <Card title="Pessoas">
          <ul className="space-y-1.5">
            {people.map((p) => (
              <li key={p.id} className="rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200">
                {p.full_name}
                {p.role_title && <span className="text-slate-500"> · {p.role_title}</span>}
              </li>
            ))}
            {people.length === 0 && <li className="text-sm text-slate-500">Nenhuma ainda.</li>}
          </ul>
          <form action={createPerson} className="space-y-2">
            <select name="organization_id" required className={inputCls} defaultValue="">
              <option value="" disabled>Organização…</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <input name="full_name" placeholder="Nome completo" required className={inputCls} />
            <input name="role_title" placeholder="Função (opcional)" className={inputCls} />
            <input name="whatsapp_phone" placeholder="WhatsApp +55… (opcional)" className={inputCls} />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="can_delegate" className="h-4 w-4 rounded border-surface-border bg-slate-900" />
              Pode criar demandas para outras pessoas
            </label>
            <button type="submit" className={btnCls}>Adicionar pessoa</button>
          </form>
        </Card>
      </div>
    </div>
  )
}

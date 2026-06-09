import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'

type Demand = {
  responsible_id: string
  origin_id: string
  status: 'nova' | 'trabalhando' | 'finalizada'
  due_date: string | null
}
type Person = { id: string; full_name: string; is_active: boolean }
type TeamMember = { person_id: string; team_id: string }
type Team = { id: string; name: string }

function Kpi({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="glass p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ?? 'text-white'}`}>{value}</p>
    </div>
  )
}

export default async function PainelPage() {
  const t = await getTranslations('panel')
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: boolean | null }> }
  const { data: isAdmin } = await sb.rpc('is_holding_admin')

  const { data: meData } = await supabase
    .from('people')
    .select('id')
    .eq('auth_user_id', user?.id ?? '')
    .eq('holding_id', holdingId)
    .limit(1)
  const me = (meData as unknown as { id: string }[] | null)?.[0]?.id

  const [demandsRes, peopleRes, tmRes, teamsRes] = await Promise.all([
    supabase.from('demands').select('responsible_id, origin_id, status, due_date'),
    supabase.from('people').select('id, full_name, is_active'),
    supabase.from('team_members').select('person_id, team_id'),
    supabase.from('teams').select('id, name'),
  ])
  const demands = (demandsRes.data ?? []) as unknown as Demand[]
  const people = (peopleRes.data ?? []) as unknown as Person[]
  const teamMembers = (tmRes.data ?? []) as unknown as TeamMember[]
  const teams = (teamsRes.data ?? []) as unknown as Team[]

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (d: Demand) => !!d.due_date && d.due_date < today && d.status !== 'finalizada'
  const nameOf = (id: string) => people.find((p) => p.id === id)?.full_name ?? '—'

  // -------- Minha produtividade --------
  const mine = demands.filter((d) => d.responsible_id === me)
  const myDone = mine.filter((d) => d.status === 'finalizada').length
  const myWorking = mine.filter((d) => d.status === 'trabalhando').length
  const myOverdue = mine.filter(isOverdue).length
  const myCreated = demands.filter((d) => d.origin_id === me).length
  const myRate = mine.length ? Math.round((myDone / mine.length) * 100) : 0

  // -------- Agregação (admin) --------
  type Agg = { total: number; done: number; working: number; overdue: number }
  const blank = (): Agg => ({ total: 0, done: 0, working: 0, overdue: 0 })
  const byPerson = new Map<string, Agg>()
  for (const d of demands) {
    const a = byPerson.get(d.responsible_id) ?? blank()
    a.total++
    if (d.status === 'finalizada') a.done++
    if (d.status === 'trabalhando') a.working++
    if (isOverdue(d)) a.overdue++
    byPerson.set(d.responsible_id, a)
  }
  const personRows = Array.from(byPerson.entries())
    .map(([pid, a]) => ({ pid, name: nameOf(pid), ...a, rate: a.total ? Math.round((a.done / a.total) * 100) : 0 }))
    .sort((x, y) => y.done - x.done || y.rate - x.rate)
  const talents = personRows.filter((r) => r.total > 0).slice(0, 5)

  const totalAll = demands.length
  const doneAll = demands.filter((d) => d.status === 'finalizada').length
  const overdueAll = demands.filter(isOverdue).length
  const rateAll = totalAll ? Math.round((doneAll / totalAll) * 100) : 0

  const teamRows = teams
    .map((tm) => {
      const memberIds = new Set(teamMembers.filter((x) => x.team_id === tm.id).map((x) => x.person_id))
      const ds = demands.filter((d) => memberIds.has(d.responsible_id))
      const done = ds.filter((d) => d.status === 'finalizada').length
      return {
        id: tm.id,
        name: tm.name,
        members: memberIds.size,
        total: ds.length,
        done,
        overdue: ds.filter(isOverdue).length,
        rate: ds.length ? Math.round((done / ds.length) * 100) : 0,
      }
    })
    .sort((a, b) => b.total - a.total)

  const thCls = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500'
  const td2 = 'px-3 py-2.5'

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('subtitle')}</p>

      {/* Minha produtividade */}
      <h2 className="mt-6 text-lg font-semibold text-white">{t('myProductivity')}</h2>
      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label={t('kpiAssigned')} value={mine.length} />
        <Kpi label={t('kpiWorking')} value={myWorking} accent="text-amber-400" />
        <Kpi label={t('kpiOverdue')} value={myOverdue} accent="text-red-400" />
        <Kpi label={t('kpiDone')} value={myDone} accent="text-emerald-400" />
        <Kpi label={t('kpiCreated')} value={myCreated} accent="text-brand" />
      </div>
      <p className="mt-2 text-sm text-slate-400">{t('completionRate')}: <span className="font-semibold text-white">{myRate}%</span></p>

      {isAdmin && (
        <>
          {/* Indicadores gerais */}
          <h2 className="mt-8 text-lg font-semibold text-white">{t('general')}</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label={t('genTotal')} value={totalAll} />
            <Kpi label={t('genDone')} value={doneAll} accent="text-emerald-400" />
            <Kpi label={t('genOverdue')} value={overdueAll} accent="text-red-400" />
            <Kpi label={t('genRate')} value={`${rateAll}%`} accent="text-brand" />
          </div>

          {/* Talentos */}
          <h2 className="mt-8 text-lg font-semibold text-white">{t('talents')}</h2>
          <p className="text-sm text-slate-400">{t('talentsHint')}</p>
          <div className="mt-3 space-y-2">
            {talents.map((r, i) => (
              <div key={r.pid} className="glass flex items-center gap-3 px-4 py-3">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${i === 0 ? 'bg-brand text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{i + 1}</span>
                <span className="flex-1 font-medium text-slate-100">{r.name}</span>
                <span className="text-sm text-emerald-400">{r.done} {t('doneShort')}</span>
                <span className="text-xs text-slate-500">{r.rate}%</span>
              </div>
            ))}
            {talents.length === 0 && <p className="text-sm text-slate-500">{t('noData')}</p>}
          </div>

          {/* Por pessoa */}
          <h2 className="mt-8 text-lg font-semibold text-white">{t('byPerson')}</h2>
          <div className="mt-3 glass overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className={thCls}>{t('colPerson')}</th>
                  <th className={thCls}>{t('colTotal')}</th>
                  <th className={thCls}>{t('colWorking')}</th>
                  <th className={thCls}>{t('colOverdue')}</th>
                  <th className={thCls}>{t('colDone')}</th>
                  <th className={thCls}>{t('colRate')}</th>
                </tr>
              </thead>
              <tbody>
                {personRows.map((r) => (
                  <tr key={r.pid} className="border-b border-surface-border/60 last:border-0">
                    <td className={`${td2} font-medium text-slate-100`}>{r.name}</td>
                    <td className={`${td2} text-slate-300`}>{r.total}</td>
                    <td className={`${td2} text-amber-300`}>{r.working}</td>
                    <td className={`${td2} text-red-300`}>{r.overdue}</td>
                    <td className={`${td2} text-emerald-300`}>{r.done}</td>
                    <td className={`${td2} text-slate-300`}>{r.rate}%</td>
                  </tr>
                ))}
                {personRows.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">{t('noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Por equipe */}
          {teamRows.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-semibold text-white">{t('byTeam')}</h2>
              <div className="mt-3 glass overflow-x-auto p-0">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className={thCls}>{t('colTeamName')}</th>
                      <th className={thCls}>{t('colMembers')}</th>
                      <th className={thCls}>{t('colTotal')}</th>
                      <th className={thCls}>{t('colOverdue')}</th>
                      <th className={thCls}>{t('colDone')}</th>
                      <th className={thCls}>{t('colRate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamRows.map((r) => (
                      <tr key={r.id} className="border-b border-surface-border/60 last:border-0">
                        <td className={`${td2} font-medium text-slate-100`}>{r.name}</td>
                        <td className={`${td2} text-slate-300`}>{r.members}</td>
                        <td className={`${td2} text-slate-300`}>{r.total}</td>
                        <td className={`${td2} text-red-300`}>{r.overdue}</td>
                        <td className={`${td2} text-emerald-300`}>{r.done}</td>
                        <td className={`${td2} text-slate-300`}>{r.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

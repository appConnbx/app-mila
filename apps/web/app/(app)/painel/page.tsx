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
type Agg = { id: string; name: string; total: number; working: number; overdue: number; done: number }
type Manager = {
  overall: { open: number; working: number; overdue: number; done: number }
  by_person: Agg[]
  by_team: Agg[]
}

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

  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: unknown }> }
  const { data: isAdmin } = (await sb.rpc('is_holding_admin')) as { data: boolean | null }

  const { data: meData } = await supabase
    .from('people')
    .select('id')
    .eq('auth_user_id', user?.id ?? '')
    .eq('holding_id', holdingId)
    .limit(1)
  const me = (meData as unknown as { id: string }[] | null)?.[0]?.id

  // Minhas demandas (RLS já restringe ao que posso ver).
  const { data: dData } = await supabase.from('demands').select('responsible_id, origin_id, status, due_date')
  const demands = (dData ?? []) as unknown as Demand[]
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (d: Demand) => !!d.due_date && d.due_date < today && d.status !== 'finalizada'

  const mine = demands.filter((d) => d.responsible_id === me)
  const myDone = mine.filter((d) => d.status === 'finalizada').length
  const myWorking = mine.filter((d) => d.status === 'trabalhando').length
  const myOverdue = mine.filter(isOverdue).length
  const myCreated = demands.filter((d) => d.origin_id === me).length
  const myRate = mine.length ? Math.round((myDone / mine.length) * 100) : 0

  // Agregados gerenciais (admin): números, sem expor demandas alheias.
  let mgr: Manager | null = null
  if (isAdmin) {
    const { data } = await sb.rpc('manager_overview')
    mgr = (data ?? null) as Manager | null
  }
  const talents = (mgr?.by_person ?? []).filter((r) => r.total > 0).slice(0, 5)

  const thCls = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500'
  const td2 = 'px-3 py-2.5'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">{t('title')}</h1>
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
      <p className="mt-2 text-sm text-slate-400">
        {t('completionRate')}: <span className="font-semibold text-white">{myRate}%</span>
      </p>

      {isAdmin && mgr && (
        <>
          {/* Visão gerencial — volumes por estrutura */}
          <h2 className="mt-8 text-lg font-semibold text-white">{t('general')}</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label={t('genOpen')} value={mgr.overall.open} accent="text-sky-300" />
            <Kpi label={t('genWorking')} value={mgr.overall.working} accent="text-amber-400" />
            <Kpi label={t('genOverdue')} value={mgr.overall.overdue} accent="text-red-400" />
            <Kpi label={t('genDone')} value={mgr.overall.done} accent="text-emerald-400" />
          </div>

          {/* Talentos (mais conclusões) */}
          <h2 className="mt-8 text-lg font-semibold text-white">{t('talents')}</h2>
          <p className="text-sm text-slate-400">{t('talentsHint')}</p>
          <div className="mt-3 space-y-2">
            {talents.map((r, i) => (
              <div key={r.id} className="glass flex items-center gap-3 px-4 py-3">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${i === 0 ? 'bg-brand text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{i + 1}</span>
                <span className="flex-1 font-medium text-slate-100">{r.name}</span>
                <span className="text-sm text-emerald-400">{r.done} {t('doneShort')}</span>
              </div>
            ))}
            {talents.length === 0 && <p className="text-sm text-slate-500">{t('noData')}</p>}
          </div>

          {/* Por pessoa */}
          <h2 className="mt-8 text-lg font-semibold text-white">{t('byPerson')}</h2>
          <div className="mt-3 glass overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={thCls}>{t('colPerson')}</th>
                  <th className={thCls}>{t('colTotal')}</th>
                  <th className={thCls}>{t('colWorking')}</th>
                  <th className={thCls}>{t('colOverdue')}</th>
                  <th className={thCls}>{t('colDone')}</th>
                </tr>
              </thead>
              <tbody>
                {(mgr.by_person ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0">
                    <td className={`${td2} font-medium text-slate-100`}>{r.name}</td>
                    <td className={`${td2} text-slate-300`}>{r.total}</td>
                    <td className={`${td2} text-amber-300`}>{r.working}</td>
                    <td className={`${td2} text-red-300`}>{r.overdue}</td>
                    <td className={`${td2} text-emerald-300`}>{r.done}</td>
                  </tr>
                ))}
                {(mgr.by_person ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-500">{t('noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Por equipe */}
          {(mgr.by_team ?? []).length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-semibold text-white">{t('byTeam')}</h2>
              <div className="mt-3 glass overflow-x-auto p-0">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className={thCls}>{t('colTeamName')}</th>
                      <th className={thCls}>{t('colTotal')}</th>
                      <th className={thCls}>{t('colWorking')}</th>
                      <th className={thCls}>{t('colOverdue')}</th>
                      <th className={thCls}>{t('colDone')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(mgr.by_team ?? []).map((r) => (
                      <tr key={r.id} className="border-b border-white/5 last:border-0">
                        <td className={`${td2} font-medium text-slate-100`}>{r.name}</td>
                        <td className={`${td2} text-slate-300`}>{r.total}</td>
                        <td className={`${td2} text-amber-300`}>{r.working}</td>
                        <td className={`${td2} text-red-300`}>{r.overdue}</td>
                        <td className={`${td2} text-emerald-300`}>{r.done}</td>
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

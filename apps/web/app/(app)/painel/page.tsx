import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { streakFromDates } from '@/lib/streak'
import { PeopleTable, type PersonRow } from './_people-table'

type AggPerson = {
  id: string
  name: string
  total: number
  working: number
  overdue: number
  done: number
  active_days: string[]
}
type AggTeam = { id: string; name: string; total: number; working: number; overdue: number; done: number }
type Manager = {
  overall: { open: number; working: number; overdue: number; done: number }
  by_person: AggPerson[]
  by_team: AggTeam[]
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
  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: unknown }> }
  const { data: isAdmin } = (await sb.rpc('is_holding_admin')) as { data: boolean | null }

  let mgr: Manager | null = null
  if (isAdmin) {
    const { data } = await sb.rpc('manager_overview')
    mgr = (data ?? null) as Manager | null
  }

  // Pessoas com chama (streak) e pontuação (concluídas + chamas).
  const personRows: (PersonRow & { score: number })[] = (mgr?.by_person ?? []).map((p) => {
    const streak = streakFromDates(p.active_days ?? [])
    return { id: p.id, name: p.name, total: p.total, working: p.working, overdue: p.overdue, done: p.done, streak, score: p.done + streak }
  })
  const talents = [...personRows].filter((r) => r.total > 0).sort((a, b) => b.score - a.score).slice(0, 5)

  const thCls = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500'
  const td2 = 'px-3 py-2.5'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">{t('title')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('subtitle')}</p>

      {!isAdmin && (
        <div className="mt-6 glass p-8 text-center text-sm text-slate-400">{t('adminOnly')}</div>
      )}

      {isAdmin && mgr && (
        <>
          {/* Visão gerencial — volumes por estrutura */}
          <h2 className="mt-6 text-lg font-semibold text-white">{t('general')}</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label={t('genOpen')} value={mgr.overall.open} accent="text-sky-300" />
            <Kpi label={t('genWorking')} value={mgr.overall.working} accent="text-amber-400" />
            <Kpi label={t('genOverdue')} value={mgr.overall.overdue} accent="text-red-400" />
            <Kpi label={t('genDone')} value={mgr.overall.done} accent="text-emerald-400" />
          </div>

          {/* Talentos (pontuação = concluídas + chamas) */}
          <h2 className="mt-8 text-lg font-semibold text-white">{t('talents')}</h2>
          <p className="text-sm text-slate-400">{t('talentsScoreHint')}</p>
          <div className="mt-3 space-y-2">
            {talents.map((r, i) => (
              <div key={r.id} className="glass flex items-center gap-3 px-4 py-3">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${i === 0 ? 'bg-brand text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{i + 1}</span>
                <span className="flex-1 font-medium text-slate-100">{r.name}</span>
                <span className="text-xs text-slate-500">✓ {r.done} · 🔥 {r.streak}</span>
                <span className="text-sm font-bold text-brand">{r.score} {t('points')}</span>
              </div>
            ))}
            {talents.length === 0 && <p className="text-sm text-slate-500">{t('noData')}</p>}
          </div>

          {/* Por pessoa (tabela ordenável + coluna Chama) */}
          <h2 className="mt-8 text-lg font-semibold text-white">{t('byPerson')}</h2>
          <PeopleTable rows={personRows} />

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

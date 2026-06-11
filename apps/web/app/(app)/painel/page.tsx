import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { streakFromDates } from '@/lib/streak'
import { StatTable, type StatRow } from './_stat-table'

type AggPerson = {
  id: string
  name: string
  total: number
  working: number
  overdue: number
  done: number
  active_days: string[]
}
type AggGroup = {
  id: string
  name: string
  total: number
  working: number
  overdue: number
  done: number
  person_ids: string[]
}
type Manager = {
  overall: { open: number; working: number; due_soon: number; overdue: number }
  by_person: AggPerson[]
  by_team: AggGroup[]
  by_area: AggGroup[]
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
  // Admin de qualquer nível (holding/org/área/equipe) vê o painel do seu escopo.
  const { data: isManager } = (await sb.rpc('is_manager')) as { data: boolean | null }

  let mgr: Manager | null = null
  if (isManager) {
    const { data } = await sb.rpc('manager_overview')
    mgr = (data ?? null) as Manager | null
  }

  // Chama (streak) por pessoa + pontuação (concluídas + chama).
  const personRows: (StatRow & { score: number })[] = (mgr?.by_person ?? []).map((p) => {
    const streak = streakFromDates(p.active_days ?? [])
    return { id: p.id, name: p.name, total: p.total, working: p.working, overdue: p.overdue, done: p.done, streak, score: p.done + streak }
  })
  const streakById = new Map(personRows.map((r) => [r.id, r.streak]))

  // Chama do grupo = soma das chamas dos seus integrantes (com demanda no escopo).
  const groupRows = (groups: AggGroup[] | undefined): StatRow[] =>
    (groups ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      total: g.total,
      working: g.working,
      overdue: g.overdue,
      done: g.done,
      streak: (g.person_ids ?? []).reduce((sum, pid) => sum + (streakById.get(pid) ?? 0), 0),
    }))
  const areaRows = groupRows(mgr?.by_area)
  const teamRows = groupRows(mgr?.by_team)

  // Ranking de engajamento (pontuação = concluídas + chama).
  const engaged = personRows.filter((r) => r.total > 0).sort((a, b) => b.score - a.score)
  const top10 = engaged.slice(0, 10)
  const topIds = new Set(top10.map((r) => r.id))
  const bottom10 = engaged.length > 10
    ? [...engaged].reverse().filter((r) => !topIds.has(r.id)).slice(0, 10)
    : []

  const rankList = (rows: typeof engaged, offsetFromEnd = false) => (
    <div className="mt-3 space-y-2">
      {rows.map((r, i) => {
        const rank = offsetFromEnd ? engaged.length - i : i + 1
        return (
          <div key={r.id} className="glass flex items-center gap-3 px-4 py-3">
            <span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${!offsetFromEnd && i === 0 ? 'bg-brand text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{rank}</span>
            <span className="flex-1 font-medium text-slate-100">{r.name}</span>
            <span className="text-xs text-slate-500">✓ {r.done} · 🔥 {r.streak}</span>
            <span className="text-sm font-bold text-brand">{r.score} {t('points')}</span>
          </div>
        )
      })}
      {rows.length === 0 && <p className="text-sm text-slate-500">{t('noData')}</p>}
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">{t('title')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('subtitle')}</p>

      {!isManager && (
        <div className="mt-6 glass p-8 text-center text-sm text-slate-400">{t('adminOnly')}</div>
      )}

      {isManager && mgr && (
        <>
          {/* Indicadores gerais — acionáveis */}
          <h2 className="mt-6 text-lg font-semibold text-white">{t('general')}</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label={t('genOpen')} value={mgr.overall.open} accent="text-sky-300" />
            <Kpi label={t('genWorking')} value={mgr.overall.working} accent="text-amber-400" />
            <Kpi label={t('genDueSoon')} value={mgr.overall.due_soon} accent="text-blue-400" />
            <Kpi label={t('genOverdue')} value={mgr.overall.overdue} accent="text-red-400" />
          </div>

          {/* Por área */}
          {areaRows.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-semibold text-white">{t('byArea')}</h2>
              <StatTable rows={areaRows} nameLabel={t('colArea')} />
            </>
          )}

          {/* Por equipe */}
          {teamRows.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-semibold text-white">{t('byTeam')}</h2>
              <StatTable rows={teamRows} nameLabel={t('colTeamName')} />
            </>
          )}

          {/* Por pessoa (chama na 1ª coluna) */}
          <h2 className="mt-8 text-lg font-semibold text-white">{t('byPerson')}</h2>
          <StatTable rows={personRows} nameLabel={t('colPerson')} streakFirst />

          {/* Ranking de engajamento (pontuação = concluídas + chama) */}
          <h2 className="mt-8 text-lg font-semibold text-white">{t('talentsTop')}</h2>
          <p className="text-sm text-slate-400">{t('talentsScoreHint')}</p>
          {rankList(top10)}

          {bottom10.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-semibold text-white">{t('talentsBottom')}</h2>
              {rankList(bottom10, true)}
            </>
          )}
        </>
      )}
    </div>
  )
}

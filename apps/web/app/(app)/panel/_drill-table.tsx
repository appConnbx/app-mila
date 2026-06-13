'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { StatRow } from './_stat-table'

export type DrillTeam = StatRow & { people: StatRow[] }
export type DrillArea = StatRow & { teams: DrillTeam[] }

type Key = keyof Omit<StatRow, 'id'>
const PAGE_SIZE = 10

/** Tabela única em cascata: área → (clique) → equipes → (clique) → pessoas.
 *  Os números de cada nível vêm da agregação no nível de equipe (onde as pessoas respondem).
 *  Colunas ordenáveis (aplica a ordenação em todos os níveis); áreas paginadas de 10 em 10. */
export function DrillTable({ areas }: { areas: DrillArea[] }) {
  const t = useTranslations('panel')
  const [sortKey, setSortKey] = useState<Key>('done')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [openAreas, setOpenAreas] = useState<Set<string>>(new Set())
  const [openTeams, setOpenTeams] = useState<Set<string>>(new Set())

  const cmp = useMemo(() => {
    return (a: StatRow, b: StatRow) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return dir === 'asc' ? c : -c
    }
  }, [sortKey, dir])

  const sortedAreas = useMemo(() => [...areas].sort(cmp), [areas, cmp])
  const pages = Math.max(1, Math.ceil(sortedAreas.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const visible = sortedAreas.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  const toggleSort = (k: Key) => {
    if (k === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setDir(k === 'name' ? 'asc' : 'desc')
    }
    setPage(0)
  }
  const toggleSet = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  const cols: { key: Key; label: string }[] = [
    { key: 'name', label: t('colStructure') },
    { key: 'streak', label: '🔥' },
    { key: 'total', label: t('colTotal') },
    { key: 'working', label: t('colWorking') },
    { key: 'overdue', label: t('colOverdue') },
    { key: 'done', label: t('colDone') },
  ]
  const arrow = (k: Key) => (k === sortKey ? (dir === 'asc' ? ' ↑' : ' ↓') : '')

  const numCells = (r: StatRow) => (
    <>
      <td className="px-3 py-2.5">
        {r.streak > 0 ? <span className="font-semibold text-amber-300">🔥 {r.streak}</span> : <span className="text-slate-600">—</span>}
      </td>
      <td className="px-3 py-2.5 text-slate-300">{r.total}</td>
      <td className="px-3 py-2.5 text-amber-300">{r.working}</td>
      <td className="px-3 py-2.5 text-red-300">{r.overdue}</td>
      <td className="px-3 py-2.5 text-emerald-300">{r.done}</td>
    </>
  )

  return (
    <div className="mt-3 glass overflow-x-auto p-0">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2 text-left">
                <button
                  type="button"
                  onClick={() => toggleSort(c.key)}
                  className={`inline-flex items-center text-xs font-medium uppercase tracking-wide transition hover:text-white ${sortKey === c.key ? 'text-brand' : 'text-slate-500'}`}
                >
                  {c.label}{arrow(c.key)}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((area) => {
            const areaOpen = openAreas.has(area.id)
            const teams = [...area.teams].sort(cmp)
            return (
              <FragmentRows key={area.id}>
                {/* Nível 1: área */}
                <tr
                  className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03]"
                  onClick={() => setOpenAreas((s) => toggleSet(s, area.id))}
                >
                  <td className="px-3 py-2.5 font-semibold text-slate-100">
                    <span className={`mr-2 inline-block text-xs text-brand transition-transform ${areaOpen ? 'rotate-90' : ''}`}>▶</span>
                    {area.name}
                  </td>
                  {numCells(area)}
                </tr>
                {/* Nível 2: equipes da área */}
                {areaOpen &&
                  teams.map((team) => {
                    const teamOpen = openTeams.has(team.id)
                    const people = [...team.people].sort(cmp)
                    return (
                      <FragmentRows key={team.id}>
                        <tr
                          className="cursor-pointer border-b border-white/5 bg-white/[0.02] transition hover:bg-white/[0.05]"
                          onClick={() => setOpenTeams((s) => toggleSet(s, team.id))}
                        >
                          <td className="px-3 py-2.5 pl-9 font-medium text-slate-200">
                            <span className={`mr-2 inline-block text-xs text-brand/80 transition-transform ${teamOpen ? 'rotate-90' : ''}`}>▶</span>
                            {team.name}
                          </td>
                          {numCells(team)}
                        </tr>
                        {/* Nível 3: pessoas da equipe */}
                        {teamOpen &&
                          people.map((p) => (
                            <tr key={p.id} className="border-b border-white/5 bg-white/[0.04]">
                              <td className="px-3 py-2.5 pl-16 text-slate-300">{p.name}</td>
                              {numCells(p)}
                            </tr>
                          ))}
                        {teamOpen && people.length === 0 && (
                          <tr className="border-b border-white/5 bg-white/[0.04]">
                            <td colSpan={cols.length} className="px-3 py-2.5 pl-16 text-xs text-slate-500">{t('noData')}</td>
                          </tr>
                        )}
                      </FragmentRows>
                    )
                  })}
              </FragmentRows>
            )
          })}
          {visible.length === 0 && (
            <tr><td colSpan={cols.length} className="px-3 py-10 text-center text-sm text-slate-500">{t('noData')}</td></tr>
          )}
        </tbody>
      </table>
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={current === 0}
            className="rounded-md px-2 py-1 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            ← {t('pagePrev')}
          </button>
          <span>{t('pageOf', { page: current + 1, pages })}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={current >= pages - 1}
            className="rounded-md px-2 py-1 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            {t('pageNext')} →
          </button>
        </div>
      )}
    </div>
  )
}

/** Agrupador sem nó DOM (linhas de tabela não aceitam <div>). */
function FragmentRows({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

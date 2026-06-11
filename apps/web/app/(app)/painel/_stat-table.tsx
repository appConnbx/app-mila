'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

export type StatRow = {
  id: string
  name: string
  streak: number
  total: number
  working: number
  overdue: number
  done: number
}

type Key = keyof Omit<StatRow, 'id'>
const PAGE_SIZE = 10

/** Tabela de indicadores (áreas/equipes/pessoas): colunas ordenáveis + paginação 10 em 10.
 *  streakFirst: chama como 1ª coluna (pessoas); senão, após o nome (áreas/equipes). */
export function StatTable({
  rows,
  nameLabel,
  streakFirst = false,
}: {
  rows: StatRow[]
  nameLabel: string
  streakFirst?: boolean
}) {
  const t = useTranslations('panel')
  const [sortKey, setSortKey] = useState<Key>('done')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    const r = [...rows]
    r.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      let cmp: number
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv
      else cmp = String(av).localeCompare(String(bv))
      return dir === 'asc' ? cmp : -cmp
    })
    return r
  }, [rows, sortKey, dir])

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const visible = sorted.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  const toggle = (k: Key) => {
    if (k === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setDir(k === 'name' ? 'asc' : 'desc')
    }
    setPage(0)
  }

  const nameCol = { key: 'name' as Key, label: nameLabel }
  const streakCol = { key: 'streak' as Key, label: '🔥' }
  const cols: { key: Key; label: string }[] = [
    ...(streakFirst ? [streakCol, nameCol] : [nameCol, streakCol]),
    { key: 'total', label: t('colTotal') },
    { key: 'working', label: t('colWorking') },
    { key: 'overdue', label: t('colOverdue') },
    { key: 'done', label: t('colDone') },
  ]

  const arrow = (k: Key) => (k === sortKey ? (dir === 'asc' ? ' ↑' : ' ↓') : '')

  const cell = (r: StatRow, k: Key) => {
    if (k === 'name') return <td key={k} className="px-3 py-2.5 font-medium text-slate-100">{r.name}</td>
    if (k === 'streak')
      return (
        <td key={k} className="px-3 py-2.5">
          {r.streak > 0 ? <span className="font-semibold text-amber-300">🔥 {r.streak}</span> : <span className="text-slate-600">—</span>}
        </td>
      )
    const tone = k === 'working' ? 'text-amber-300' : k === 'overdue' ? 'text-red-300' : k === 'done' ? 'text-emerald-300' : 'text-slate-300'
    return <td key={k} className={`px-3 py-2.5 ${tone}`}>{r[k]}</td>
  }

  return (
    <div className="mt-3 glass overflow-x-auto p-0">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2 text-left">
                <button
                  type="button"
                  onClick={() => toggle(c.key)}
                  className={`inline-flex items-center text-xs font-medium uppercase tracking-wide transition hover:text-white ${sortKey === c.key ? 'text-brand' : 'text-slate-500'}`}
                >
                  {c.label}{arrow(c.key)}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.id} className="border-b border-white/5 last:border-0">
              {cols.map((c) => cell(r, c.key))}
            </tr>
          ))}
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

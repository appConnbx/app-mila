'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

export type PersonRow = {
  id: string
  name: string
  total: number
  working: number
  overdue: number
  done: number
  streak: number
}

type Key = keyof Omit<PersonRow, 'id'>

export function PeopleTable({ rows }: { rows: PersonRow[] }) {
  const t = useTranslations('panel')
  const [sortKey, setSortKey] = useState<Key>('done')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')

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

  const toggle = (k: Key) => {
    if (k === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setDir(k === 'name' ? 'asc' : 'desc')
    }
  }

  const cols: { key: Key; label: string; cls?: string }[] = [
    { key: 'streak', label: '🔥' },
    { key: 'name', label: t('colPerson') },
    { key: 'total', label: t('colTotal') },
    { key: 'working', label: t('colWorking') },
    { key: 'overdue', label: t('colOverdue') },
    { key: 'done', label: t('colDone') },
  ]

  const arrow = (k: Key) => (k === sortKey ? (dir === 'asc' ? ' ↑' : ' ↓') : '')

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
          {sorted.map((r) => (
            <tr key={r.id} className="border-b border-white/5 last:border-0">
              <td className="px-3 py-2.5">
                <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                  {r.streak > 0 ? `🔥 ${r.streak}` : <span className="text-slate-600">—</span>}
                </span>
              </td>
              <td className="px-3 py-2.5 font-medium text-slate-100">{r.name}</td>
              <td className="px-3 py-2.5 text-slate-300">{r.total}</td>
              <td className="px-3 py-2.5 text-amber-300">{r.working}</td>
              <td className="px-3 py-2.5 text-red-300">{r.overdue}</td>
              <td className="px-3 py-2.5 text-emerald-300">{r.done}</td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">{t('noData')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { Pill, thCbx, tdCbx, btnGhostCbx, fmtDate } from '../_ui'
import { PasswordField } from '../_password-field'
import { cbxSetUserActive, cbxSetUserPassword } from './actions'

export type InstanceUserRow = {
  id: string
  full_name: string
  email: string | null
  is_active: boolean
  is_admin: boolean
  has_login: boolean
  created_at: string
  last_sign_in_at: string | null
  streak: number
}

type SortKey = 'name' | 'created' | 'lastlogin' | 'streak' | 'status'
const PAGE = 20

export function InstanceUsers({ holdingId, rows, canManage }: { holdingId: string; rows: InstanceUserRow[]; canManage: boolean }) {
  const [q, setQ] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? rows.filter((r) => r.full_name.toLowerCase().includes(s) || (r.email ?? '').toLowerCase().includes(s)) : rows
  }, [q, rows])

  const sorted = useMemo(() => {
    const m = dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') return a.full_name.localeCompare(b.full_name) * m
      if (sortKey === 'created') return (Date.parse(a.created_at) - Date.parse(b.created_at)) * m
      if (sortKey === 'lastlogin') return ((a.last_sign_in_at ? Date.parse(a.last_sign_in_at) : 0) - (b.last_sign_in_at ? Date.parse(b.last_sign_in_at) : 0)) * m
      if (sortKey === 'streak') return (a.streak - b.streak) * m
      return (Number(a.is_active) - Number(b.is_active)) * m
    })
  }, [filtered, sortKey, dir])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE))
  const cur = Math.min(page, pageCount)
  const pageRows = sorted.slice((cur - 1) * PAGE, cur * PAGE)
  const open = rows.find((r) => r.id === openId) ?? null

  const toggle = (k: SortKey) => {
    if (k === sortKey) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setDir('asc') }
    setPage(1)
  }
  const arrow = (k: SortKey) => (sortKey === k ? (dir === 'asc' ? ' ↑' : ' ↓') : '')
  const Th = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th className={`${thCbx} ${right ? 'text-right' : ''}`}>
      <button type="button" onClick={() => toggle(k)} className="uppercase tracking-wide transition hover:text-slate-200">{label}{arrow(k)}</button>
    </th>
  )

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Usuários da instância ({rows.length})</h2>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          placeholder="Buscar por nome…"
          className="w-56 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-1.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400/60"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <Th k="name" label="Usuário" />
              <Th k="created" label="Cadastro" />
              <Th k="lastlogin" label="Último login" />
              <Th k="streak" label="🔥 Chama" />
              <Th k="status" label="Status" />
              <th className={`${thCbx} text-right`}></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((u) => (
              <tr key={u.id} className={`border-b border-white/5 last:border-0 ${u.is_active ? '' : 'opacity-55'}`}>
                <td className={tdCbx}>
                  <p className="font-semibold text-slate-100">{u.full_name} {u.is_admin && <Pill tone="info">admin</Pill>}</p>
                  <p className="text-xs text-slate-500">{u.email ?? 'sem e-mail'}</p>
                </td>
                <td className={`${tdCbx} text-slate-400`}>{fmtDate(u.created_at)}</td>
                <td className={`${tdCbx} text-slate-400`}>{u.last_sign_in_at ? fmtDate(u.last_sign_in_at) : <span className="text-slate-600">nunca</span>}</td>
                <td className={tdCbx}>
                  {u.streak > 0 ? <span className="font-semibold text-amber-300">🔥 {u.streak}</span> : <span className="text-slate-600">—</span>}
                </td>
                <td className={tdCbx}><Pill tone={u.is_active ? 'ok' : undefined}>{u.is_active ? 'Ativo' : 'Inativo'}</Pill></td>
                <td className={`${tdCbx} text-right`}>
                  <button onClick={() => setOpenId(u.id)} className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/10">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>Página {cur} de {pageCount}</span>
          <div className="flex gap-2">
            <button disabled={cur <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`${btnGhostCbx} disabled:opacity-40`}>Anterior</button>
            <button disabled={cur >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className={`${btnGhostCbx} disabled:opacity-40`}>Próxima</button>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpenId(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{open.full_name}</h3>
                <p className="text-xs text-slate-500">{open.email ?? 'sem e-mail'} · {open.has_login ? 'tem acesso' : 'sem login'}</p>
              </div>
              <button onClick={() => setOpenId(null)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Fechar">✕</button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Pill tone={open.is_active ? 'ok' : undefined}>{open.is_active ? 'Ativo' : 'Inativo'}</Pill>
              {open.streak > 0 && <Pill tone="warn">🔥 {open.streak}</Pill>}
            </div>

            {canManage ? (
              <div className="mt-5 space-y-4">
                <form action={cbxSetUserActive}>
                  <input type="hidden" name="holding_id" value={holdingId} />
                  <input type="hidden" name="person_id" value={open.id} />
                  <input type="hidden" name="active" value={open.is_active ? '0' : '1'} />
                  <button className="w-full rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
                    {open.is_active ? 'Desativar usuário' : 'Reativar usuário'}
                  </button>
                </form>

                {open.email ? (
                  <form action={cbxSetUserPassword} className="space-y-2 rounded-xl border border-white/10 bg-slate-900/60 p-3">
                    <input type="hidden" name="holding_id" value={holdingId} />
                    <input type="hidden" name="person_id" value={open.id} />
                    <label className="block text-[11px] uppercase tracking-wide text-slate-500">Definir senha (super admin)</label>
                    <PasswordField placeholder="Nova senha (mín. 6)" />
                    <button className="w-full rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">Definir senha</button>
                  </form>
                ) : (
                  <p className="text-xs text-slate-500">Cadastre um e-mail para este usuário antes de definir a senha.</p>
                )}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">Você não tem permissão para gerenciar usuários.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ClientRow } from './page'

// Faturado ESTIMADO: preço do plano × períodos desde o cadastro (não há montante
// real em billing_events). VIP/grátis = 0. Rótulo "estim." deixa claro no UI.
function estRevenueCents(c: ClientRow): number {
  if (!c.price_cents || c.is_unlimited) return 0
  const start = new Date(c.created_at).getTime()
  const elapsed = Date.now() - start
  const annual = /year|annual|anual|ano/i.test(c.billing_interval ?? '')
  const periodMs = annual ? 365 * 86400000 : 30 * 86400000
  const periods = Math.max(1, Math.floor(elapsed / periodMs) + 1)
  return c.price_cents * periods
}

function fmtMoney(cents: number, currency: string | null, locale: string): string {
  if (!cents) return '—'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'BRL' }).format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency ?? ''}`.trim()
  }
}

type SortKey = 'name' | 'revenue' | 'created'

export function ComercialList({ clients, locale = 'pt-BR' }: { clients: ClientRow[]; locale?: string }) {
  const [q, setQ] = useState('')
  const [plans, setPlans] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const planOptions = useMemo(
    () => Array.from(new Set(clients.map((c) => c.plan_name ?? 'Sem plano'))).sort(),
    [clients],
  )

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    const filtered = clients.filter((c) => {
      if (plans.size && !plans.has(c.plan_name ?? 'Sem plano')) return false
      if (!s) return true
      return (
        c.name.toLowerCase().includes(s) ||
        (c.business_type ?? '').toLowerCase().includes(s) ||
        (c.plan_name ?? '').toLowerCase().includes(s) ||
        (c.contact_name ?? '').toLowerCase().includes(s) ||
        [c.city, c.state, c.country].filter(Boolean).join(' ').toLowerCase().includes(s)
      )
    })
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir
      if (sortKey === 'created') return (Date.parse(a.created_at) - Date.parse(b.created_at)) * dir
      return (estRevenueCents(a) - estRevenueCents(b)) * dir
    })
  }, [clients, q, plans, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir(k === 'name' ? 'asc' : 'desc') }
  }
  const arrow = (k: SortKey) => (sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')
  const togglePlan = (p: string) => setPlans((cur) => { const n = new Set(cur); n.has(p) ? n.delete(p) : n.add(p); return n })

  const totalEst = rows.reduce((acc, c) => acc + estRevenueCents(c), 0)
  const region = (c: ClientRow) => [c.city, c.state, c.country].filter(Boolean).join(' / ')
  const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500'
  const td = 'px-4 py-3 align-top'
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="space-y-4">
      {/* Toolbar: busca + total estimado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-400">
          <span aria-hidden>🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente, plano, tipo, região…"
            className="w-64 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 sm:w-80"
          />
        </div>
        <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300">
          Faturado estim. (filtro): <b className="text-amber-300">{fmtMoney(totalEst, 'BRL', locale)}</b>
        </span>
      </div>

      {/* Filtro multi-plano */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-slate-500">Planos:</span>
        {planOptions.map((p) => {
          const on = plans.has(p)
          return (
            <button
              key={p}
              type="button"
              onClick={() => togglePlan(p)}
              className={`rounded-full border px-3 py-1 text-xs transition ${on ? 'border-amber-400/50 bg-amber-400/15 text-amber-200' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
            >
              {p}
            </button>
          )
        })}
        {plans.size > 0 && (
          <button type="button" onClick={() => setPlans(new Set())} className="text-xs text-slate-500 underline-offset-2 hover:text-white hover:underline">
            limpar
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className={th}><button type="button" onClick={() => toggleSort('name')} className="uppercase tracking-wide hover:text-slate-200">Cliente{arrow('name')}</button></th>
              <th className={th}>Plano</th>
              <th className={th}>Uso</th>
              <th className={th}><button type="button" onClick={() => toggleSort('revenue')} className="uppercase tracking-wide hover:text-slate-200">Faturado estim.{arrow('revenue')}</button></th>
              <th className={th}><button type="button" onClick={() => toggleSort('created')} className="uppercase tracking-wide hover:text-slate-200">Cadastro{arrow('created')}</button></th>
              <th className={th}>Status</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.holding_id} className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]">
                <td className={td}>
                  <Link href={`/cbx/comercial/${c.holding_id}`} className="font-semibold text-slate-100 hover:text-amber-300">{c.name}</Link>
                  <p className="text-xs text-slate-500">
                    {c.kind === 'family' ? 'Família' : 'Corporativo'}
                    {c.business_type ? ` · ${c.business_type}` : ''}
                    {region(c) ? ` · ${region(c)}` : ''}
                  </p>
                </td>
                <td className={td}>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200">{c.plan_name ?? '—'}</span>
                    {c.is_unlimited && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">VIP</span>}
                  </div>
                  <p className="text-xs text-slate-500">{c.provider ?? ''}</p>
                </td>
                <td className={`${td} text-slate-200`}>{c.used ?? 0} / {c.is_unlimited ? '∞' : c.seat_limit ?? '—'}</td>
                <td className={`${td} font-semibold ${estRevenueCents(c) > 0 ? 'text-amber-200' : 'text-slate-500'}`}>
                  {fmtMoney(estRevenueCents(c), c.currency, locale)}
                </td>
                <td className={`${td} text-slate-400`}>{fmtDate(c.created_at)}</td>
                <td className={td}>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.sub_status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : c.sub_status ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-300'}`}>
                    {c.sub_status ?? 'sem licença'}
                  </span>
                </td>
                <td className={td}>
                  <Link href={`/cbx/comercial/${c.holding_id}`} className="text-xs font-semibold text-amber-300 underline-offset-2 hover:underline">Abrir →</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">Nenhum cliente encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">Faturado estim. = preço do plano × períodos desde o cadastro (estimativa; ainda sem captura de valores reais de pagamento).</p>
    </div>
  )
}

'use client'

import { useMemo, useState, type ReactNode } from 'react'

/* =========================================================================
   Simulador de comissão recorrente — Programa de Afiliados MILA.

   - Uma única ilha de cliente que controla a QUANTIDADE por plano e renderiza
     DUAS tabelas com o mesmo estado: comissão padrão (35%) e a comissão de
     lançamento (50% vitalício de junho). Ao mexer na 1ª tabela, a 2ª espelha.
   - Base mensal:
       BR  = valor da parcela 12x (é assim que a Hotmart repassa a comissão ao
             longo do ano; renova anualmente). Comissão = base × taxa, em R$.
       INTL= mensalidade em US$. Comissão = base × taxa, em US$; a coluna
             "Extrato (R$)" converte pela cotação de referência (prop fx).
   - Dados de plano vêm via prop (derivados de lib/plans.ts no servidor) para
     não duplicar a fonte de preços.
   ========================================================================= */

export type SimPlan = {
  id: string
  group: 'br-corp' | 'br-fam' | 'intl-corp' | 'intl-fam'
  name: string
  currency: 'BRL' | 'USD'
  base: number // base mensal na moeda do plano
  price: string // rótulo de preço para exibição
}

type Labels = {
  table35Title: string
  table50Title: string
  colPlan: string
  colPrice: string
  colCommission: string
  colQty: string
  colExtract: string
  totalLabel: string
  perYear: string
  groupBrCorp: string
  groupBrFam: string
  groupIntlCorp: string
  groupIntlFam: string
  deltaLabel: string
  fxNote: string
  hint: string
}

const GROUP_ORDER: SimPlan['group'][] = ['br-corp', 'br-fam', 'intl-corp', 'intl-fam']

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const usd = (n: number) =>
  'US$' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function AffiliateSimulator({
  plans,
  fx,
  defaults,
  labels: l,
}: {
  plans: SimPlan[]
  fx: number
  defaults?: Record<string, number>
  labels: Labels
}) {
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const p of plans) init[p.id] = defaults?.[p.id] ?? 0
    return init
  })

  const setOne = (id: string, n: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(999, Math.floor(n || 0))) }))

  // Comissão recorrente mensal de UMA unidade, na moeda do plano, à taxa dada.
  const unitCommission = (p: SimPlan, rate: number) => p.base * rate
  // Extrato mensal de UMA unidade convertido para R$.
  const unitExtractBRL = (p: SimPlan, rate: number) => (p.currency === 'USD' ? p.base * rate * fx : p.base * rate)

  const totalBRL = (rate: number) => plans.reduce((sum, p) => sum + unitExtractBRL(p, rate) * (qty[p.id] ?? 0), 0)

  const total35 = useMemo(() => totalBRL(0.35), [qty, plans, fx]) // eslint-disable-line react-hooks/exhaustive-deps
  const total50 = useMemo(() => totalBRL(0.5), [qty, plans, fx]) // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = GROUP_ORDER.map((g) => ({ g, items: plans.filter((p) => p.group === g) })).filter((x) => x.items.length)
  const groupLabel: Record<SimPlan['group'], string> = {
    'br-corp': l.groupBrCorp,
    'br-fam': l.groupBrFam,
    'intl-corp': l.groupIntlCorp,
    'intl-fam': l.groupIntlFam,
  }

  function Stepper({ id }: { id: string }) {
    const v = qty[id] ?? 0
    return (
      <div className="inline-flex items-center overflow-hidden rounded-lg border border-white/15 bg-slate-900/70">
        <button
          type="button"
          onClick={() => setOne(id, v - 1)}
          aria-label="Diminuir"
          className="grid h-9 w-9 place-items-center text-lg text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
          disabled={v <= 0}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={999}
          value={v}
          onChange={(e) => setOne(id, Number(e.target.value))}
          aria-label="Quantidade"
          className="h-9 w-12 border-x border-white/10 bg-transparent text-center text-sm font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => setOne(id, v + 1)}
          aria-label="Aumentar"
          className="grid h-9 w-9 place-items-center text-lg text-brand transition hover:bg-brand/10"
        >
          +
        </button>
      </div>
    )
  }

  function Table({ rate, editable, accent }: { rate: number; editable: boolean; accent: 'brand' | 'gold' }) {
    const headRing = accent === 'gold' ? 'text-amber-300' : 'text-brand'
    return (
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3 font-semibold">{l.colPlan}</th>
              <th className="px-4 py-3 font-semibold">{l.colPrice}</th>
              <th className={`px-4 py-3 font-semibold ${headRing}`}>{l.colCommission}</th>
              <th className="px-4 py-3 text-center font-semibold">{l.colQty}</th>
              <th className="px-4 py-3 text-right font-semibold">{l.colExtract}</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ g, items }) => (
              <FragmentGroup key={g} label={groupLabel[g]}>
                {items.map((p) => {
                  const q = qty[p.id] ?? 0
                  const unit = unitCommission(p, rate)
                  const extract = unitExtractBRL(p, rate) * q
                  return (
                    <tr key={p.id} className={`border-b border-white/5 ${q > 0 ? 'bg-brand/[0.04]' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-white">{p.name}</td>
                      <td className="px-4 py-3 text-slate-400">{p.price}</td>
                      <td className={`px-4 py-3 font-medium ${accent === 'gold' ? 'text-amber-200' : 'text-brand'}`}>
                        {p.currency === 'USD' ? `${usd(unit)}/mês` : `${brl(unit)}/mês`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editable ? (
                          <Stepper id={p.id} />
                        ) : (
                          <span className="inline-grid h-9 min-w-[3rem] place-items-center rounded-lg border border-white/10 bg-slate-900/50 px-2 text-sm font-bold text-white">
                            {q}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-white">{extract > 0 ? brl(extract) : '—'}</td>
                    </tr>
                  )
                })}
              </FragmentGroup>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* TABELA 35% */}
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-lg font-bold text-white">{l.table35Title}</h3>
          <p className="text-xs text-slate-500">{l.hint}</p>
        </div>
        <Table rate={0.35} editable accent="brand" />
        <TotalBar value={total35} label={l.totalLabel} perYearLabel={l.perYear} accent="brand" />
      </div>

      {/* TABELA 50% (espelha as quantidades acima) */}
      <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-amber-500/[0.08] to-transparent p-4 sm:p-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-lg font-bold text-amber-200">{l.table50Title}</h3>
          {total50 > 0 && (
            <p className="text-xs font-semibold text-amber-300">
              {l.deltaLabel} <span className="tabular-nums">{brl(total50 - total35)}/mês</span>
            </p>
          )}
        </div>
        <Table rate={0.5} editable={false} accent="gold" />
        <TotalBar value={total50} label={l.totalLabel} perYearLabel={l.perYear} accent="gold" />
      </div>

      <p className="text-center text-[11px] leading-relaxed text-slate-500">{l.fxNote}</p>
    </div>
  )
}

function FragmentGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <tr>
        <td colSpan={5} className="bg-white/[0.02] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </td>
      </tr>
      {children}
    </>
  )
}

function TotalBar({
  value,
  label,
  perYearLabel,
  accent,
}: {
  value: number
  label: string
  perYearLabel: string
  accent: 'brand' | 'gold'
}) {
  const gold = accent === 'gold'
  return (
    <div
      className={`mt-4 flex flex-col items-center justify-between gap-2 rounded-2xl border px-5 py-5 sm:flex-row ${
        gold ? 'border-amber-400/40 bg-amber-500/10' : 'border-brand/30 bg-brand/[0.06]'
      }`}
    >
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider ${gold ? 'text-amber-300' : 'text-brand'}`}>{label}</p>
        <p className="text-[11px] text-slate-400">
          {perYearLabel}{' '}
          <span className="font-semibold text-slate-300">
            {(value * 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </span>
        </p>
      </div>
      <p className={`text-4xl font-extrabold tabular-nums sm:text-5xl ${gold ? 'text-amber-300' : 'text-white'}`}>
        {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <span className="ml-1 text-base font-medium text-slate-400">/mês</span>
      </p>
    </div>
  )
}

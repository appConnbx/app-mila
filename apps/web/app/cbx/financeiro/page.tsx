import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cbxMe, hasPerm } from '../_lib'
import { CbxCard, Kpi, fmtMoney } from '../_ui'

type Finance = {
  ok: boolean
  monthly_revenue: { month: string; currency: string; total: number }[]
  affiliate_split: { afiliado: number; direta: number }
  active_by_plan: { plan: string; kind: string; count: number; price_cents: number | null; currency: string | null }[]
  mrr_cents: { currency: string; total_cents: number }[]
  subs_flow: { month: string; novas: number; canceladas: number }[]
  totals: { clientes: number; assinaturas_ativas: number; past_due: number; suspensas: number }
}

function Bar({ value, max, label, sub }: { value: number; max: number; label: string; sub?: string }) {
  const pct = max > 0 ? Math.max(Math.round((value / max) * 100), 2) : 0
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-slate-200">{label}</span>
        <span className="text-slate-400">{sub ?? value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-amber-400/80" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function CbxFinanceiroPage() {
  const me = await cbxMe()
  if (!me.is_staff || !(hasPerm(me, 'FINANCEIRO') || hasPerm(me, 'CEO'))) notFound()

  const supabase = await createClient()
  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: Finance | null }> }
  const { data: f } = await sb.rpc('cbx_finance_summary')
  if (!f?.ok) notFound()

  const maxRevenue = Math.max(...f.monthly_revenue.map((m) => m.total), 0)
  const maxPlan = Math.max(...f.active_by_plan.map((p) => p.count), 0)
  const totalSplit = f.affiliate_split.afiliado + f.affiliate_split.direta

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Financeiro</h1>
        <p className="mt-1 text-sm text-slate-400">
          Receita e assinaturas a partir dos eventos da Hotmart e do licenciamento manual.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Clientes" value={f.totals.clientes} />
        <Kpi label="Assinaturas ativas" value={f.totals.assinaturas_ativas} tone="ok" />
        <Kpi label="Pagamento atrasado" value={f.totals.past_due} tone={f.totals.past_due > 0 ? 'warn' : undefined} />
        <Kpi label="Suspensas" value={f.totals.suspensas} tone={f.totals.suspensas > 0 ? 'warn' : undefined} />
      </div>

      {/* MRR potencial */}
      <CbxCard title="MRR (assinaturas recorrentes ativas)">
        {f.mrr_cents.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma assinatura recorrente ativa ainda (licenças VIP são vitalícias e não entram no MRR).</p>
        ) : (
          <div className="flex flex-wrap gap-6">
            {f.mrr_cents.map((m) => (
              <p key={m.currency} className="text-3xl font-bold text-white">
                {fmtMoney(m.total_cents, m.currency)}<span className="ml-1 text-sm font-normal text-slate-500">/mês</span>
              </p>
            ))}
          </div>
        )}
      </CbxCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receita mensal */}
        <CbxCard title="Receita mensal (12 meses)">
          {f.monthly_revenue.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma venda registrada via Hotmart ainda.</p>
          ) : (
            <div className="space-y-3">
              {f.monthly_revenue.map((m) => (
                <Bar
                  key={`${m.month}-${m.currency}`}
                  value={m.total}
                  max={maxRevenue}
                  label={m.month}
                  sub={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: m.currency }).format(m.total)}
                />
              ))}
            </div>
          )}
        </CbxCard>

        {/* Vendas por plano */}
        <CbxCard title="Assinaturas ativas por plano">
          {f.active_by_plan.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma assinatura ativa.</p>
          ) : (
            <div className="space-y-3">
              {f.active_by_plan.map((p, i) => (
                <Bar
                  key={i}
                  value={p.count}
                  max={maxPlan}
                  label={`${p.plan} (${p.kind === 'family' ? 'Família' : p.kind === 'corporate' ? 'Corporativo' : p.kind})`}
                  sub={`${p.count}`}
                />
              ))}
            </div>
          )}
        </CbxCard>

        {/* Afiliado vs direta */}
        <CbxCard title="Origem das vendas">
          {totalSplit === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma venda Hotmart processada ainda.</p>
          ) : (
            <div className="space-y-3">
              <Bar value={f.affiliate_split.afiliado} max={totalSplit} label="Via afiliado" sub={`${f.affiliate_split.afiliado}`} />
              <Bar value={f.affiliate_split.direta} max={totalSplit} label="Venda direta" sub={`${f.affiliate_split.direta}`} />
            </div>
          )}
        </CbxCard>

        {/* Fluxo de assinaturas */}
        <CbxCard title="Novas × canceladas (12 meses)">
          {f.subs_flow.length === 0 ? (
            <p className="text-sm text-slate-500">Sem movimentação ainda.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {f.subs_flow.map((m) => (
                <div key={m.month} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2">
                  <span className="text-slate-300">{m.month}</span>
                  <span>
                    <span className="font-semibold text-emerald-300">+{m.novas}</span>
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="font-semibold text-rose-300">-{m.canceladas}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CbxCard>
      </div>
    </div>
  )
}

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cbxMe, hasPerm } from '../_lib'
import { CbxCard, Kpi, fmtMoney } from '../_ui'

type Ceo = {
  ok: boolean
  clients: {
    total: number; corporativo: number; familia: number; ativos: number
    by_state: { state: string; country: string | null; count: number }[]
    by_business_type: { type: string; count: number }[]
  }
  tickets: {
    abertos: number; total: number
    by_type: { type: string; count: number }[]
    by_kind: { kind: string; count: number }[]
  }
}
type Finance = {
  ok: boolean
  mrr_cents: { currency: string; total_cents: number }[]
  affiliate_split: { afiliado: number; direta: number }
  totals: { clientes: number; assinaturas_ativas: number; past_due: number; suspensas: number }
  monthly_revenue: { month: string; currency: string; total: number }[]
}

export default async function CbxCeoPage() {
  const me = await cbxMe()
  if (!me.is_staff || !hasPerm(me, 'CEO')) notFound()

  const supabase = await createClient()
  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: unknown }> }
  const [ceoRes, finRes] = await Promise.all([sb.rpc('cbx_ceo_summary'), sb.rpc('cbx_finance_summary')])
  const c = ceoRes.data as Ceo | null
  const f = finRes.data as Finance | null
  if (!c?.ok) notFound()

  const lastRevenue = f?.monthly_revenue?.at(-1)
  const totalSplit = (f?.affiliate_split?.afiliado ?? 0) + (f?.affiliate_split?.direta ?? 0)
  const affiliatePct = totalSplit > 0 ? Math.round(((f?.affiliate_split?.afiliado ?? 0) / totalSplit) * 100) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Visão executiva</h1>
        <p className="mt-1 text-sm text-slate-400">Os principais indicadores do negócio em uma tela.</p>
      </div>

      {/* Financeiro */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          label="MRR"
          value={f?.mrr_cents?.length ? f.mrr_cents.map((m) => fmtMoney(m.total_cents, m.currency)).join(' + ') : 'R$ 0,00'}
          tone="ok"
        />
        <Kpi
          label="Receita no mês"
          value={lastRevenue ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: lastRevenue.currency }).format(lastRevenue.total) : 'R$ 0,00'}
        />
        <Kpi label="Assinaturas ativas" value={f?.totals?.assinaturas_ativas ?? 0} />
        <Kpi label="Vendas via afiliado" value={affiliatePct == null ? '—' : `${affiliatePct}%`} />
      </div>

      {/* Comercial */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Clientes" value={c.clients.total} />
        <Kpi label="Corporativo" value={c.clients.corporativo} />
        <Kpi label="Família" value={c.clients.familia} />
        <Kpi label="Ativos" value={c.clients.ativos} tone="ok" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CbxCard title="Clientes por região">
          {c.clients.by_state.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sem dados de região ainda — o Comercial enriquece o cadastro de cada cliente na ficha (estado/cidade).
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {c.clients.by_state.map((s, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2">
                  <span className="text-slate-200">{s.state}{s.country ? ` · ${s.country}` : ''}</span>
                  <span className="font-semibold text-white">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CbxCard>

        <CbxCard title="Perfil dos clientes (tipo de negócio)">
          {c.clients.by_business_type.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sem dados de perfil ainda — preencha o tipo de negócio na ficha de cada cliente.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {c.clients.by_business_type.map((b, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2">
                  <span className="text-slate-200">{b.type}</span>
                  <span className="font-semibold text-white">{b.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CbxCard>

        <CbxCard title="Suporte — visão geral">
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Tickets abertos" value={c.tickets.abertos} tone={c.tickets.abertos > 0 ? 'warn' : 'ok'} />
            <Kpi label="Total histórico" value={c.tickets.total} />
          </div>
          {c.tickets.by_type.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm">
              {c.tickets.by_type.map((t, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2">
                  <span className="text-slate-200">{t.type === 'incidente' ? 'Incidentes' : 'Solicitações'}</span>
                  <span className="font-semibold text-white">{t.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CbxCard>

        <CbxCard title="Tickets por tipo de cliente">
          {c.tickets.by_kind.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum ticket registrado ainda.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {c.tickets.by_kind.map((k, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2">
                  <span className="text-slate-200">
                    {k.kind === 'corporate' ? 'Corporativo' : k.kind === 'family' ? 'Família' : k.kind}
                  </span>
                  <span className="font-semibold text-white">{k.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CbxCard>
      </div>
    </div>
  )
}

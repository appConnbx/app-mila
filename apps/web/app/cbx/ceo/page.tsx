import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { cbxMe, hasPerm } from "../_lib";
import { CbxCard, Kpi, fmtMoney } from "../_ui";

type Ceo = {
  ok: boolean;
  finance: {
    mrr_cents: { currency: string; total_cents: number }[];
    revenue_month: { currency: string; total: number }[];
    new_subs_month: number;
    new_mrr_cents_month: number;
  };
  active: { total: number; corporativo: number; familia_pago: number; familia_free: number };
  canceled_month: {
    total: number;
    corporativo: number;
    familia_pago: number;
    familia_free: number;
  };
  by_state: { state: string; country: string | null; count: number }[];
  by_business_type: { type: string; count: number }[];
  support: {
    open_total: number;
    new_month: number;
    monthly: { month: string; abertos: number; concluidos: number }[];
    by_kind: { kind: string; count: number }[];
  };
};

const money = (
  arr: { currency: string; total_cents?: number; total?: number }[],
  cents: boolean,
) => {
  if (!arr?.length) return "R$ 0,00";
  return arr
    .map((x) =>
      cents
        ? fmtMoney(x.total_cents ?? 0, x.currency)
        : new Intl.NumberFormat("pt-BR", { style: "currency", currency: x.currency }).format(
            x.total ?? 0,
          ),
    )
    .join(" + ");
};

/** Barras agrupadas abertos/concluídos por mês. */
function SupportChart({
  data,
}: { data: { month: string; abertos: number; concluidos: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.abertos, d.concluidos]), 1);
  return (
    <div className="flex items-end gap-4 overflow-x-auto pb-2" style={{ height: 160 }}>
      {data.map((d) => (
        <div key={d.month} className="flex flex-col items-center gap-1">
          <div className="flex items-end gap-1" style={{ height: 120 }}>
            <div
              className="w-4 rounded-t bg-amber-400/80"
              style={{ height: `${(d.abertos / max) * 100}%` }}
              title={`${d.abertos} abertos`}
            />
            <div
              className="w-4 rounded-t bg-emerald-400/80"
              style={{ height: `${(d.concluidos / max) * 100}%` }}
              title={`${d.concluidos} concluídos`}
            />
          </div>
          <span className="text-[10px] text-slate-500">
            {d.month.slice(5)}/{d.month.slice(2, 4)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function CbxCeoPage() {
  const me = await cbxMe();
  if (!me.is_staff || !hasPerm(me, "CEO")) notFound();

  const supabase = await createClient();
  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: Ceo | null }> };
  const { data: c } = await sb.rpc("cbx_ceo_summary");
  if (!c?.ok) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Visão executiva</h1>
        <p className="mt-1 text-sm text-slate-400">
          Os principais indicadores do negócio em uma tela.
        </p>
      </div>

      {/* Financeiro */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Financeiro
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="MRR" value={money(c.finance.mrr_cents, true)} tone="ok" />
          <Kpi label="Faturamento (mês até agora)" value={money(c.finance.revenue_month, false)} />
          <Kpi label="Novas assinaturas (mês)" value={c.finance.new_subs_month} />
          <Kpi label="MRR das novas (mês)" value={fmtMoney(c.finance.new_mrr_cents_month, "BRL")} />
        </div>
      </div>

      {/* Base ativa */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Assinaturas ativas
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Ativas (total)" value={c.active.total} tone="ok" />
          <Kpi label="Corporativo" value={c.active.corporativo} />
          <Kpi label="Família paga" value={c.active.familia_pago} />
          <Kpi label="Família free" value={c.active.familia_free} />
        </div>
      </div>

      {/* Cancelamentos do mês */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cancelamentos no mês
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi
            label="Total"
            value={c.canceled_month.total}
            tone={c.canceled_month.total > 0 ? "warn" : undefined}
          />
          <Kpi label="Corporativo" value={c.canceled_month.corporativo} />
          <Kpi label="Família paga" value={c.canceled_month.familia_pago} />
          <Kpi label="Família free" value={c.canceled_month.familia_free} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CbxCard title="Clientes por região">
          {c.by_state.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sem dados de região ainda — preencha na ficha de cada cliente (Comercial).
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {c.by_state.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2"
                >
                  <span className="text-slate-200">
                    {s.state}
                    {s.country ? ` · ${s.country}` : ""}
                  </span>
                  <span className="font-semibold text-white">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CbxCard>

        <CbxCard title="Clientes por tipo de negócio">
          {c.by_business_type.length === 0 ? (
            <p className="text-sm text-slate-500">
              Sem dados de perfil ainda — selecione o tipo de negócio na ficha do cliente.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {c.by_business_type.map((b, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2"
                >
                  <span className="text-slate-200">{b.type}</span>
                  <span className="font-semibold text-white">{b.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CbxCard>
      </div>

      {/* Suporte */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Suporte</p>
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi
            label="Tickets abertos"
            value={c.support.open_total}
            tone={c.support.open_total > 0 ? "warn" : "ok"}
          />
          <Kpi label="Novos no mês" value={c.support.new_month} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CbxCard title="Abertos × concluídos por mês">
            {c.support.monthly.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum ticket ainda.</p>
            ) : (
              <>
                <SupportChart data={c.support.monthly} />
                <div className="mt-2 flex gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-400/80" /> Abertos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400/80" /> Concluídos
                  </span>
                </div>
              </>
            )}
          </CbxCard>

          <CbxCard title="Tickets por tipo de cliente">
            {c.support.by_kind.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum ticket registrado ainda.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {c.support.by_kind.map((k, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2"
                  >
                    <span className="text-slate-200">
                      {k.kind === "corporate"
                        ? "Corporativo"
                        : k.kind === "family"
                          ? "Família"
                          : k.kind}
                    </span>
                    <span className="font-semibold text-white">{k.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CbxCard>
        </div>
      </div>
    </div>
  );
}

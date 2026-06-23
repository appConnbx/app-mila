"use client";

import { type ReactNode, useMemo, useState } from "react";

/* =========================================================================
   Simulador de comissão — Programa de Afiliados appMila.

   Dois motores de ganho (modelo real):
   - BRASIL = VENDA ÚNICA. O cliente parcela em 12x, mas para o afiliado é uma
     venda só: comissão (em R$) paga de uma vez → "faturamento direto".
     kind: 'oneTime'.
   - INTERNACIONAL = ASSINATURA mensal em US$: comissão recorrente todo mês →
     "recorrente internacional". kind: 'recurring'.

   IMPORTANTE: os valores de comissão (comm25/comm50) são os PRATICADOS PELA
   HOTMART (já refletem as taxas da plataforma), não um cálculo de rate × preço.
   Podem variar conforme a modalidade de parcelamento escolhida pelo comprador.

   Quantidade COMPARTILHADA entre as duas tabelas (tier 25 e 50) — monta-se o
   cenário uma vez e compara-se as comissões. Ambas editáveis. O bloco de
   lançamento entra entre elas (prop `middle`). `fx` converte o recorrente em
   US$ para uma referência aproximada em R$.
   ========================================================================= */

export type SimPlan = {
  id: string;
  group: "br-corp" | "br-fam" | "intl-corp" | "intl-fam";
  name: string;
  currency: "BRL" | "USD";
  kind: "oneTime" | "recurring";
  price: string; // rótulo do valor do plano
  comm25: number; // comissão por venda (BR, R$) ou mensal (INTL, US$) no tier 25%
  comm50: number; // idem no tier 50%
};

type Labels = {
  table25Title: string;
  table50Title: string;
  colPlan: string;
  colPrice: string;
  colCommission: string;
  colQty: string;
  colExtract: string;
  directLabel: string;
  directHint: string;
  recurringLabel: string;
  recurringHint: string;
  approx: string;
  perYear: string;
  groupBrCorp: string;
  groupBrFam: string;
  groupIntlCorp: string;
  groupIntlFam: string;
  hint: string;
  fxNote: string;
};

const GROUP_ORDER: SimPlan["group"][] = ["br-corp", "br-fam", "intl-corp", "intl-fam"];

const brl = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const brl0 = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const usd = (n: number) =>
  "US$" + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function AffiliateSimulator({
  plans,
  fx,
  defaults,
  labels: l,
  middle,
}: {
  plans: SimPlan[];
  fx: number;
  defaults?: Record<string, number>;
  labels: Labels;
  middle?: ReactNode;
}) {
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of plans) init[p.id] = defaults?.[p.id] ?? 0;
    return init;
  });
  const setOne = (id: string, n: number) =>
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(999, Math.floor(n || 0))) }));

  const unitCommission = (p: SimPlan, tier: 25 | 50) => (tier === 50 ? p.comm50 : p.comm25);

  // Faturamento direto (R$): soma das vendas BR (one-time).
  const directTotal = (tier: 25 | 50) =>
    plans
      .filter((p) => p.kind === "oneTime")
      .reduce((s, p) => s + unitCommission(p, tier) * (qty[p.id] ?? 0), 0);
  // Recorrente internacional (US$/mês): soma das assinaturas INTL.
  const recurringTotalUSD = (tier: 25 | 50) =>
    plans
      .filter((p) => p.kind === "recurring")
      .reduce((s, p) => s + unitCommission(p, tier) * (qty[p.id] ?? 0), 0);

  const direct25 = useMemo(() => directTotal(25), [qty, plans]); // eslint-disable-line react-hooks/exhaustive-deps
  const rec25 = useMemo(() => recurringTotalUSD(25), [qty, plans]); // eslint-disable-line react-hooks/exhaustive-deps
  const direct50 = useMemo(() => directTotal(50), [qty, plans]); // eslint-disable-line react-hooks/exhaustive-deps
  const rec50 = useMemo(() => recurringTotalUSD(50), [qty, plans]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = GROUP_ORDER.map((g) => ({ g, items: plans.filter((p) => p.group === g) })).filter(
    (x) => x.items.length,
  );
  const groupLabel: Record<SimPlan["group"], string> = {
    "br-corp": l.groupBrCorp,
    "br-fam": l.groupBrFam,
    "intl-corp": l.groupIntlCorp,
    "intl-fam": l.groupIntlFam,
  };

  function Stepper({ id, accent }: { id: string; accent: "brand" | "gold" }) {
    const v = qty[id] ?? 0;
    const plus =
      accent === "gold" ? "text-amber-300 hover:bg-amber-500/10" : "text-brand hover:bg-brand/10";
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
          aria-label="Quantidade de vendas"
          className="h-9 w-12 border-x border-white/10 bg-transparent text-center text-sm font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => setOne(id, v + 1)}
          aria-label="Aumentar"
          className={`grid h-9 w-9 place-items-center text-lg transition ${plus}`}
        >
          +
        </button>
      </div>
    );
  }

  function Table({ tier, accent }: { tier: 25 | 50; accent: "brand" | "gold" }) {
    const headCol = accent === "gold" ? "text-amber-300" : "text-brand";
    const unitCol = accent === "gold" ? "text-amber-200" : "text-brand";
    return (
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3 font-semibold">{l.colPlan}</th>
              <th className="px-4 py-3 font-semibold">{l.colPrice}</th>
              <th className={`px-4 py-3 font-semibold ${headCol}`}>{l.colCommission}</th>
              <th className="px-4 py-3 text-center font-semibold">{l.colQty}</th>
              <th className="px-4 py-3 text-right font-semibold">{l.colExtract}</th>
            </tr>
          </thead>
          <tbody>
            {grouped.flatMap(({ g, items }) => {
              const rows = [
                <tr key={`h-${g}`}>
                  <td
                    colSpan={5}
                    className="bg-white/[0.02] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    {groupLabel[g]}
                  </td>
                </tr>,
              ];
              for (const p of items) {
                const q = qty[p.id] ?? 0;
                const unit = unitCommission(p, tier);
                const isRec = p.kind === "recurring";
                // Extrato sempre em R$ (INTL convertido da comissão em US$ pela cotação fx).
                const extractBRL = (isRec ? unit * fx : unit) * q;
                rows.push(
                  <tr
                    key={p.id}
                    className={`border-b border-white/5 ${q > 0 ? (accent === "gold" ? "bg-amber-500/[0.05]" : "bg-brand/[0.04]") : ""}`}
                  >
                    <td className="px-4 py-3 font-semibold text-white">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400">{p.price}</td>
                    <td className={`px-4 py-3 font-medium ${unitCol}`}>
                      {isRec ? `${usd(unit)}/mês` : `${brl(unit)} por venda`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Stepper id={p.id} accent={accent} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-white">
                      {extractBRL > 0 ? `${brl(extractBRL)}${isRec ? "/mês" : ""}` : "—"}
                    </td>
                  </tr>,
                );
              }
              return rows;
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* TABELA 25% */}
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-lg font-bold text-white">{l.table25Title}</h3>
          <p className="text-xs text-slate-500">{l.hint}</p>
        </div>
        <Table tier={25} accent="brand" />
        <Totals direct={direct25} recUSD={rec25} fx={fx} l={l} accent="brand" />
      </div>

      {/* BLOCO DE LANÇAMENTO (entre as tabelas) */}
      {middle}

      {/* TABELA 50% — mesma quantidade, também editável */}
      <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-amber-500/[0.08] to-transparent p-4 sm:p-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-lg font-bold text-amber-200">{l.table50Title}</h3>
          <p className="text-xs text-amber-300/80">{l.hint}</p>
        </div>
        <Table tier={50} accent="gold" />
        <Totals direct={direct50} recUSD={rec50} fx={fx} l={l} accent="gold" />
      </div>

      <p className="text-center text-[11px] leading-relaxed text-slate-500">{l.fxNote}</p>
    </div>
  );
}

function Totals({
  direct,
  recUSD,
  fx,
  l,
  accent,
}: {
  direct: number;
  recUSD: number;
  fx: number;
  l: Labels;
  accent: "brand" | "gold";
}) {
  const gold = accent === "gold";
  const card = gold ? "border-amber-400/40 bg-amber-500/10" : "border-brand/30 bg-brand/[0.06]";
  const lab = gold ? "text-amber-300" : "text-brand";
  const val = gold ? "text-amber-300" : "text-white";
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className={`rounded-2xl border px-5 py-5 ${card}`}>
        <p className={`text-xs font-semibold uppercase tracking-wider ${lab}`}>{l.directLabel}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{l.directHint}</p>
        <p className={`mt-1 text-3xl font-extrabold tabular-nums sm:text-4xl ${val}`}>
          {brl(direct)}
        </p>
      </div>
      <div className={`rounded-2xl border px-5 py-5 ${card}`}>
        <p className={`text-xs font-semibold uppercase tracking-wider ${lab}`}>
          {l.recurringLabel}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">{l.recurringHint}</p>
        <p className={`mt-1 text-3xl font-extrabold tabular-nums sm:text-4xl ${val}`}>
          {brl(recUSD * fx)}
          <span className="ml-1 text-base font-medium text-slate-400">/mês</span>
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          {l.approx} <span className="font-semibold text-slate-300">{usd(recUSD)}/mês</span> ·{" "}
          {l.perYear} <span className="font-semibold text-slate-300">{brl0(recUSD * fx * 12)}</span>
        </p>
      </div>
    </div>
  );
}

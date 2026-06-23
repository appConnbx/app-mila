import type { MilaPlan } from "@/lib/stripe/catalog";

// FONTE ÚNICA de metadados de plano (label, preço internacional USD e dados de
// checkout BR/Hotmart). Consumido pelas páginas de vendas (_sales/plans.ts) e
// pelo gate de assinatura (subscribe/page.tsx). Os price_id do Stripe ficam em
// lib/stripe/catalog.ts (gerados por script); aqui só metadados de exibição/CTA.
//
// BR  = produto Hotmart Brasil (P106262837P): corp anual cobrado em 12x; família
//        anual (à vista) com opção de 12x. 'off' = código da oferta anual.
// USD = assinatura internacional mensal (Stripe), valor sem símbolo.

export type PlanMeta = {
  label: string;
  usd: string;
  br?: { off: string; parcela?: string; total?: string; annual?: string };
};

export const PLANS: Record<MilaPlan, PlanMeta> = {
  starter: { label: "Starter", usd: "87", br: { off: "wyitwc3d", parcela: "297", total: "3.564" } },
  growth: { label: "Growth", usd: "167", br: { off: "2kxlbff2", parcela: "497", total: "5.964" } },
  scale: { label: "Scale", usd: "337", br: { off: "abpzxjap", parcela: "697", total: "8.364" } },
  enterprise: {
    label: "Enterprise",
    usd: "667",
    br: { off: "yl7fpa6u", parcela: "1.117", total: "13.404" },
  },
  family: { label: "Family", usd: "13", br: { off: "i67ovflk", annual: "97", parcela: "8,08" } },
  family_plus: {
    label: "Family Plus",
    usd: "17",
    br: { off: "tfkn6adh", annual: "127", parcela: "10,58" },
  },
};

export const CORP_PLANS: MilaPlan[] = ["starter", "growth", "scale", "enterprise"];
export const FAM_PLANS: MilaPlan[] = ["family", "family_plus"];

// Hotmart: produto BR único; a oferta (off) define o plano.
export const hotmartBrUrl = (off: string) => `https://pay.hotmart.com/P106262837P?off=${off}`;

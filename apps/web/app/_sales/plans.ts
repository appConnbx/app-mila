import { CORP_PLANS, FAM_PLANS, PLANS, hotmartBrUrl } from "@/lib/plans";
import type { SalesPlan } from "./SalesPage";

/* Páginas de vendas: derivam de lib/plans.ts (fonte única de label/preço/oferta).
   BR  = Hotmart anual (corp 12x; família anual ou 12x).
   INTL = assinatura mensal US$ via gate /subscribe (valida e-mail) antes do Stripe. */

// Assinatura internacional: passa pelo gate /subscribe (valida e-mail) antes do
// Stripe. O idioma é derivado da página de origem (next).
const stripeHref = (plan: string, next: string) => {
  const lang = next.startsWith("/en") ? "en" : next.startsWith("/es") ? "es" : "pt-BR";
  return `/subscribe?plan=${plan}&next=${encodeURIComponent(next)}&lang=${lang}`;
};

const CORP_FEATURED = 2; // Scale
const FAM_FEATURED = 1; // Family Plus

type CorpLabels = { users: string[]; cta: string; popular: string; unit?: string; next?: string };
type FamLabels = { users: string[]; cta: string; popular: string; unit?: string; next?: string };

export function corpPlansBR(l: CorpLabels): SalesPlan[] {
  return CORP_PLANS.map((slug, i) => {
    const p = PLANS[slug];
    return {
      name: p.label,
      users: l.users[i],
      priceMain: `R$${p.br!.parcela}`,
      priceUnit: "",
      priceSub: `12x · ou R$${p.br!.total} à vista (plano anual)`,
      href: hotmartBrUrl(p.br!.off),
      cta: l.cta,
      featured: i === CORP_FEATURED,
      popular: l.popular,
    };
  });
}

export function corpPlansINTL(l: CorpLabels): SalesPlan[] {
  return CORP_PLANS.map((slug, i) => {
    const p = PLANS[slug];
    return {
      name: p.label,
      users: l.users[i],
      priceMain: `US$${p.usd}`,
      priceUnit: l.unit ?? "/month",
      href: stripeHref(slug, l.next ?? "/"),
      cta: l.cta,
      featured: i === CORP_FEATURED,
      popular: l.popular,
    };
  });
}

export function famPlansBR(l: FamLabels): SalesPlan[] {
  return FAM_PLANS.map((slug, i) => {
    const p = PLANS[slug];
    return {
      name: p.label,
      users: l.users[i],
      priceMain: `R$${p.br!.annual}`,
      priceUnit: "/ano",
      priceSub: `ou 12x de R$${p.br!.parcela}`,
      href: hotmartBrUrl(p.br!.off),
      cta: l.cta,
      featured: i === FAM_FEATURED,
      popular: l.popular,
    };
  });
}

export function famPlansINTL(l: FamLabels): SalesPlan[] {
  return FAM_PLANS.map((slug, i) => {
    const p = PLANS[slug];
    return {
      name: p.label,
      users: l.users[i],
      priceMain: `US$${p.usd}`,
      priceUnit: l.unit ?? "/month",
      href: stripeHref(slug, l.next ?? "/"),
      cta: l.cta,
      featured: i === FAM_FEATURED,
      popular: l.popular,
    };
  });
}

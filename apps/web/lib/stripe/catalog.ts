// Catálogo Stripe (internacional, USD, mensal). Gerado por scripts/stripe-setup.mjs.
// Os price_id diferem entre TESTE e PRODUÇÃO. priceId() escolhe o conjunto certo
// pela chave secreta em uso (sk_test → teste, sk_live → produção). Estes IDs não
// são segredo. Para sobrescrever pontualmente, use STRIPE_PRICE_<PLAN> no ambiente.

export type MilaPlan = "starter" | "growth" | "scale" | "enterprise" | "family" | "family_plus";

export const STRIPE_PRICES_TEST: Record<MilaPlan, string> = {
  starter: "price_1ThyUkEm7cIGWIkfpPIruPOd",
  growth: "price_1ThyUlEm7cIGWIkfSigGqclc",
  scale: "price_1ThyUmEm7cIGWIkfDm9ag7PZ",
  enterprise: "price_1ThyUnEm7cIGWIkfuWqFbG56",
  family: "price_1ThyUoEm7cIGWIkf1Z06iMJK",
  family_plus: "price_1ThyUpEm7cIGWIkfwIO5SduL",
};

export const STRIPE_PRICES_LIVE: Record<MilaPlan, string> = {
  starter: "price_1ThzEGIYZ4gib3sWA3MAcm2u",
  growth: "price_1ThzEIIYZ4gib3sW1IaowCxv",
  scale: "price_1ThzEJIYZ4gib3sW5H6AMLSz",
  enterprise: "price_1ThzEHIYZ4gib3sWIrT94cSt",
  family: "price_1ThzEGIYZ4gib3sWOxUHVHCY",
  family_plus: "price_1ThzEGIYZ4gib3sWbBdRAI8H",
};

function isLive(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live");
}

export function priceId(plan: MilaPlan): string {
  const fromEnv = process.env[`STRIPE_PRICE_${plan.toUpperCase()}`];
  if (fromEnv) return fromEnv;
  return (isLive() ? STRIPE_PRICES_LIVE : STRIPE_PRICES_TEST)[plan];
}

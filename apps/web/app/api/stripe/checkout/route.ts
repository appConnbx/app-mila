import { type MilaPlan, STRIPE_PRICES_TEST, priceId } from "@/lib/stripe/catalog";
import { stripeApi } from "@/lib/stripe/client";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLANS = new Set(Object.keys(STRIPE_PRICES_TEST));
// Só permite caminhos internos como retorno (evita open-redirect).
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const plan = url.searchParams.get("plan") ?? "";
  const next = safeNext(url.searchParams.get("next"));
  const origin = process.env.APP_BASE_URL || url.origin;
  // Idioma do comprador, derivado da página de origem (en/es/pt) — usado no e-mail
  // de criar senha e na página de boas-vindas.
  const lang = next.startsWith("/en") ? "en" : next.startsWith("/es") ? "es" : "pt-BR";

  if (!PLANS.has(plan)) {
    return NextResponse.redirect(`${origin}${next}?erro=plano`, { status: 303 });
  }

  try {
    const session = await stripeApi<{ id: string; url: string }>("POST", "/checkout/sessions", {
      mode: "subscription",
      "line_items[0][price]": priceId(plan as MilaPlan),
      "line_items[0][quantity]": 1,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${origin}/welcome?lang=${lang}`,
      cancel_url: `${origin}${next}?checkout=cancelado`,
      "metadata[mila_plan]": plan,
      "metadata[mila_lang]": lang,
      "subscription_data[metadata][mila_plan]": plan,
    });
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro";
    console.error("stripe checkout", msg);
    return NextResponse.redirect(`${origin}${next}?erro=checkout`, { status: 303 });
  }
}

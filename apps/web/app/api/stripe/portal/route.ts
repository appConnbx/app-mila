import { stripeApi } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Abre o Stripe Billing Portal para o cliente logado (trocar cartão / cancelar).
export async function GET(req: NextRequest) {
  const origin = process.env.APP_BASE_URL || new URL(req.url).origin;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`, { status: 303 });

  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: string | null }> };
  const { data: customerId } = await sb.rpc("my_stripe_customer");
  if (!customerId) return NextResponse.redirect(`${origin}/subscription`, { status: 303 });

  try {
    const session = await stripeApi<{ url: string }>("POST", "/billing_portal/sessions", {
      customer: customerId,
      return_url: `${origin}/subscription`,
    });
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (e) {
    console.error("stripe portal", e instanceof Error ? e.message : e);
    return NextResponse.redirect(`${origin}/subscription?erro=portal`, { status: 303 });
  }
}

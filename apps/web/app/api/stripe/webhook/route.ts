import { verifyStripeSignature } from "@/lib/stripe/client";
import { processStripeEvent } from "@/lib/stripe/webhook";
import { createAdminClient } from "@/lib/supabase/admin";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any;

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "webhook não configurado" }, { status: 500 });
  }

  const raw = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!verifyStripeSignature(raw, sig, webhookSecret)) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  let event: Any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }

  const admin = createAdminClient();
  const sb = admin as unknown as {
    from: (t: string) => {
      insert: (v: Record<string, unknown>) => {
        select: (c: string) => {
          single: () => Promise<{
            data: { id: string } | null;
            error: { code?: string; message: string } | null;
          }>;
        };
      };
      update: (v: Record<string, unknown>) => { eq: (c: string, val: string) => Promise<unknown> };
    };
  };

  const eventType = String(event?.type ?? "unknown");
  const externalEventId = event?.id != null ? String(event.id) : null;

  // Idempotência: índice único (provider, external_event_id).
  const { data: inserted, error: insertErr } = await sb
    .from("billing_events")
    .insert({
      provider: "stripe",
      event_type: eventType,
      external_event_id: externalEventId,
      payload: event,
      status: "recebido",
    })
    .select("id")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }
  const eventRowId = inserted!.id;

  try {
    const result = await processStripeEvent(admin, event);
    await sb
      .from("billing_events")
      .update({
        status: result.status,
        holding_id: result.holdingId ?? null,
        subscription_id: result.subscriptionId ?? null,
        error_message: result.status === "erro" ? (result.message ?? null) : null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", eventRowId);
    return NextResponse.json({ ok: true, status: result.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "erro inesperado";
    await sb
      .from("billing_events")
      .update({ status: "erro", error_message: message })
      .eq("id", eventRowId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

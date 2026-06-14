import crypto from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processHotmartEvent } from '@/lib/hotmart/webhook'

// Webhooks precisam de Node runtime (body cru, sem edge).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any

export async function POST(request: NextRequest) {
  const expected = process.env.HOTMART_HOTTOK
  if (!expected) {
    return NextResponse.json({ error: 'webhook não configurado' }, { status: 500 })
  }

  const raw = await request.text()
  let payload: Any
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'payload inválido' }, { status: 400 })
  }

  // Validação do hottok: header (2.0) ou campo no corpo (1.x). Comparação em
  // tempo constante (evita timing oracle sobre o segredo), como no Stripe.
  const hottok = String(request.headers.get('x-hotmart-hottok') ?? payload?.hottok ?? '')
  const a = Buffer.from(hottok)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'hottok inválido' }, { status: 401 })
  }

  const admin = createAdminClient()
  const sb = admin as unknown as {
    from: (t: string) => {
      insert: (v: Record<string, unknown>) => {
        select: (c: string) => { single: () => Promise<{ data: { id: string } | null; error: { code?: string; message: string } | null }> }
      }
      update: (v: Record<string, unknown>) => { eq: (c: string, val: string) => Promise<unknown> }
    }
  }

  const eventType = String(payload?.event ?? 'UNKNOWN')
  const externalEventId = payload?.id != null ? String(payload.id) : null

  // Idempotência: o índice único (provider, external_event_id) impede duplicatas.
  const { data: inserted, error: insertErr } = await sb
    .from('billing_events')
    .insert({ provider: 'hotmart', event_type: eventType, external_event_id: externalEventId, payload, status: 'recebido' })
    .select('id')
    .single()

  if (insertErr) {
    // 23505 = unique_violation → evento já recebido; confirma sem reprocessar.
    if (insertErr.code === '23505') return NextResponse.json({ ok: true, duplicate: true })
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  const eventRowId = inserted!.id

  try {
    const result = await processHotmartEvent(admin, payload)
    await sb
      .from('billing_events')
      .update({
        status: result.status,
        holding_id: result.holdingId ?? null,
        subscription_id: result.subscriptionId ?? null,
        error_message: result.status === 'erro' ? result.message ?? null : null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventRowId)

    return NextResponse.json({ ok: true, status: result.status })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'erro inesperado'
    await sb.from('billing_events').update({ status: 'erro', error_message: message }).eq('id', eventRowId)
    // 500 → Hotmart tenta novamente (falha provavelmente transitória).
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

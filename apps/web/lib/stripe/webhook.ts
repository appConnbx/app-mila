import type { SupabaseClient } from '@supabase/supabase-js'
import { stripeApi } from './client'

/* Processa eventos do Stripe para o APP MILA (assinaturas internacionais).
   Reaproveita provision_subscription (provider='stripe'). Escrita via admin. */

export type StripeResult = {
  status: 'processado' | 'ignorado' | 'erro'
  holdingId?: string | null
  subscriptionId?: string | null
  message?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any
type Admin = SupabaseClient
type RpcAdmin = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
}

// mila_plan (metadata do preço/sessão) → slug do plano internacional no banco.
const INTL_SLUG: Record<string, string> = {
  starter: 'corp-starter-20-intl',
  growth: 'corp-growth-50-intl',
  scale: 'corp-scale-200-intl',
  enterprise: 'corp-enterprise-intl',
  family: 'family-5-intl',
  family_plus: 'family-plus-10-intl',
}

// status do Stripe → subscription_status do MILA.
function mapStatus(s?: string): string {
  switch (s) {
    case 'active': return 'active'
    case 'trialing': return 'trialing'
    case 'past_due':
    case 'unpaid':
    case 'incomplete': return 'past_due'
    case 'canceled':
    case 'incomplete_expired': return 'canceled'
    default: return 'active'
  }
}
const toIso = (epochSecs?: number | null) => (epochSecs ? new Date(epochSecs * 1000).toISOString() : null)

async function planIdBySlug(admin: Admin, slug: string): Promise<string | null> {
  const sb = admin as unknown as { from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { limit: (n: number) => Promise<{ data: { id: string }[] | null }> } } } }
  const { data } = await sb.from('plans').select('id').eq('slug', slug).limit(1)
  return data?.[0]?.id ?? null
}

async function ensureAuthUser(admin: Admin, email: string): Promise<string | null> {
  const base = process.env.APP_BASE_URL ?? 'https://www.appmila.co'
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${base}/login` })
  if (!error && data?.user?.id) return data.user.id
  const { data: existing } = await (admin as unknown as RpcAdmin).rpc('auth_user_id_by_email', { p_email: email })
  return (existing as string | null) ?? null
}

async function findSubByCode(admin: Admin, code: string) {
  const sb = admin as unknown as { from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { limit: (n: number) => Promise<{ data: { id: string; holding_id: string }[] | null }> } } } }
  const { data } = await sb.from('subscriptions').select('id, holding_id').eq('external_subscription_code', code).limit(1)
  return data?.[0] ?? null
}

async function updateSub(admin: Admin, id: string, patch: Record<string, unknown>) {
  const sb = admin as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> } } }
  await sb.from('subscriptions').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
}

export async function processStripeEvent(admin: Admin, event: Any): Promise<StripeResult> {
  const type = String(event?.type ?? '')
  const obj = event?.data?.object ?? {}

  // ----- Provisionamento: assinatura paga no Checkout -----
  if (type === 'checkout.session.completed') {
    if (obj.mode !== 'subscription') return { status: 'ignorado', message: 'sessão não-assinatura' }
    const email = obj.customer_details?.email ?? obj.customer_email
    const milaPlan = obj.metadata?.mila_plan
    const subId = typeof obj.subscription === 'string' ? obj.subscription : obj.subscription?.id
    const customerId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id
    if (!email) return { status: 'erro', message: 'email ausente' }
    if (!subId) return { status: 'erro', message: 'subscription ausente' }
    const slug = INTL_SLUG[milaPlan]
    if (!slug) return { status: 'ignorado', message: `mila_plan não mapeado: ${milaPlan}` }
    const planId = await planIdBySlug(admin, slug)
    if (!planId) return { status: 'erro', message: `plano não encontrado: ${slug}` }

    // Busca o período atual da assinatura (uma chamada à API).
    let periodEnd: string | null = null
    try {
      const sub = await stripeApi<{ current_period_end?: number }>('GET', `/subscriptions/${subId}`)
      periodEnd = toIso(sub.current_period_end)
    } catch { /* segue sem o período; subscription.updated ajusta depois */ }

    const authUserId = await ensureAuthUser(admin, email)
    const { data, error } = await (admin as unknown as RpcAdmin).rpc('provision_subscription', {
      p_plan_id: planId,
      p_provider: 'stripe',
      p_external_subscription_code: subId,
      p_buyer_email: email,
      p_buyer_name: obj.customer_details?.name ?? null,
      p_auth_user_id: authUserId,
      p_current_period_end: periodEnd,
      p_external_transaction: customerId ?? null,
    })
    if (error) return { status: 'erro', message: error.message }
    const res = data as { ok: boolean; reason?: string; holding_id?: string; subscription_id?: string }
    if (!res?.ok) return { status: 'erro', message: res?.reason ?? 'provision_failed' }
    return { status: 'processado', holdingId: res.holding_id, subscriptionId: res.subscription_id }
  }

  // ----- Renovação / mudança de estado -----
  if (type === 'customer.subscription.updated') {
    const sub = await findSubByCode(admin, obj.id)
    if (!sub) return { status: 'ignorado', message: 'assinatura não encontrada' }
    await updateSub(admin, sub.id, {
      status: mapStatus(obj.status),
      current_period_end: toIso(obj.current_period_end) ?? undefined,
      canceled_at: obj.cancel_at_period_end ? new Date().toISOString() : null,
    })
    return { status: 'processado', holdingId: sub.holding_id, subscriptionId: sub.id }
  }

  // ----- Cancelamento definitivo -----
  if (type === 'customer.subscription.deleted') {
    const sub = await findSubByCode(admin, obj.id)
    if (!sub) return { status: 'ignorado', message: 'assinatura não encontrada' }
    await updateSub(admin, sub.id, {
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      current_period_end: toIso(obj.current_period_end) ?? undefined,
    })
    return { status: 'processado', holdingId: sub.holding_id, subscriptionId: sub.id }
  }

  // ----- Falha de pagamento: marca past_due (acesso segue até o fim do período) -----
  if (type === 'invoice.payment_failed') {
    const subId = typeof obj.subscription === 'string' ? obj.subscription : obj.subscription?.id
    if (!subId) return { status: 'ignorado', message: 'sem subscription' }
    const sub = await findSubByCode(admin, subId)
    if (!sub) return { status: 'ignorado', message: 'assinatura não encontrada' }
    await updateSub(admin, sub.id, { status: 'past_due' })
    return { status: 'processado', holdingId: sub.holding_id, subscriptionId: sub.id }
  }

  return { status: 'ignorado', message: `evento sem tratamento: ${type}` }
}

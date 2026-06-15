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
// incomplete/unpaid NÃO concedem acesso (suspenso); past_due mantém até o fim do período.
function mapStatus(s?: string): string {
  switch (s) {
    case 'active': return 'active'
    case 'trialing': return 'trialing'
    case 'past_due': return 'past_due'
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired': return 'suspended'
    case 'canceled': return 'canceled'
    // Status desconhecido NÃO concede acesso (conservador): evita liberar por
    // um estado novo/imprevisto do Stripe.
    default: return 'suspended'
  }
}
const toIso = (epochSecs?: number | null) => (epochSecs ? new Date(epochSecs * 1000).toISOString() : null)

// current_period_end migrou para o item da assinatura na API atual (2025+);
// lê do item com fallback para a raiz (contas em API antiga).
function periodEndOf(sub: Any): string | null {
  return toIso(sub?.items?.data?.[0]?.current_period_end ?? sub?.current_period_end)
}

async function planIdBySlug(admin: Admin, slug: string): Promise<string | null> {
  const sb = admin as unknown as { from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { limit: (n: number) => Promise<{ data: { id: string }[] | null }> } } } }
  const { data } = await sb.from('plans').select('id').eq('slug', slug).limit(1)
  return data?.[0]?.id ?? null
}

async function ensureAuthUser(admin: Admin, email: string, lang?: string): Promise<string | null> {
  const base = process.env.APP_BASE_URL ?? 'https://www.appmila.co'
  const langQs = lang ? `&lang=${encodeURIComponent(lang)}` : ''
  const redirectTo = `${base}/auth/confirm?next=${encodeURIComponent('/create-password')}${langQs}`
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo })
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

// Reembolso/disputa não trazem a subscription direto — resolve pela do customer.
async function findSubByCustomer(admin: Admin, customerId: string) {
  const sb = admin as unknown as Any
  const { data } = await sb
    .from('subscriptions')
    .select('id, holding_id')
    .eq('external_transaction', customerId)
    .eq('provider', 'stripe')
    .order('created_at', { ascending: false })
    .limit(1)
  return (data?.[0] as { id: string; holding_id: string } | undefined) ?? null
}

// Corta acesso imediatamente (espelha o tratamento de reembolso da Hotmart).
async function suspendAccess(admin: Admin, sub: { id: string; holding_id: string }) {
  await updateSub(admin, sub.id, { status: 'suspended' })
  const sb = admin as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> } } }
  await sb.from('holdings').update({ status: 'suspended' }).eq('id', sub.holding_id)
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
      const sub = await stripeApi<Any>('GET', `/subscriptions/${subId}`)
      periodEnd = periodEndOf(sub)
    } catch (e) {
      console.warn('stripe: falha ao ler período da assinatura', subId, e instanceof Error ? e.message : e)
    }

    const authUserId = await ensureAuthUser(admin, email, obj.metadata?.mila_lang)
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
      current_period_end: periodEndOf(obj) ?? undefined,
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
      current_period_end: periodEndOf(obj) ?? undefined,
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

  // ----- Reembolso TOTAL: corta acesso -----
  if (type === 'charge.refunded') {
    if (obj.amount_refunded != null && obj.amount != null && obj.amount_refunded < obj.amount) {
      return { status: 'ignorado', message: 'reembolso parcial' }
    }
    const customerId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id
    if (!customerId) return { status: 'ignorado', message: 'sem customer' }
    const sub = await findSubByCustomer(admin, customerId)
    if (!sub) return { status: 'ignorado', message: 'assinatura não encontrada' }
    await suspendAccess(admin, sub)
    return { status: 'processado', holdingId: sub.holding_id, subscriptionId: sub.id }
  }

  // ----- Disputa/chargeback aberto: corta acesso -----
  if (type === 'charge.dispute.created') {
    const chargeId = typeof obj.charge === 'string' ? obj.charge : obj.charge?.id
    let customerId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id
    if (!customerId && chargeId) {
      try {
        const ch = await stripeApi<Any>('GET', `/charges/${chargeId}`)
        customerId = typeof ch.customer === 'string' ? ch.customer : ch.customer?.id
      } catch (e) {
        console.warn('stripe: falha ao resolver charge da disputa', chargeId, e instanceof Error ? e.message : e)
      }
    }
    if (!customerId) return { status: 'ignorado', message: 'sem customer' }
    const sub = await findSubByCustomer(admin, customerId)
    if (!sub) return { status: 'ignorado', message: 'assinatura não encontrada' }
    await suspendAccess(admin, sub)
    return { status: 'processado', holdingId: sub.holding_id, subscriptionId: sub.id }
  }

  return { status: 'ignorado', message: `evento sem tratamento: ${type}` }
}

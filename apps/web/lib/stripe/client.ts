import crypto from 'node:crypto'

/* Cliente Stripe mínimo via REST (sem dependência externa).
   Usa STRIPE_SECRET_KEY. Form-encoding com chaves aninhadas (metadata[x], etc.). */

const API = 'https://api.stripe.com/v1'

function secret(): string {
  const k = process.env.STRIPE_SECRET_KEY
  if (!k) throw new Error('STRIPE_SECRET_KEY ausente')
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function form(obj: any, prefix = '', out = new URLSearchParams()): URLSearchParams {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (typeof v === 'object' && !Array.isArray(v)) form(v, key, out)
    else if (Array.isArray(v)) v.forEach((item, i) => form({ [i]: item }, key, out))
    else out.append(key, String(v))
  }
  return out
}

export async function stripeApi<T = unknown>(
  method: 'GET' | 'POST',
  path: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: Record<string, any>,
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? form(body) : undefined,
  })
  const json = await res.json()
  if (!res.ok) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (json as any)?.error?.message || `Stripe ${res.status}`
    throw new Error(msg)
  }
  return json as T
}

/**
 * Verifica a assinatura do webhook (header `stripe-signature`).
 * Implementa o mesmo esquema do Stripe: HMAC-SHA256 de `${t}.${payload}`.
 * Tolerância de 5 min contra replay.
 */
export function verifyStripeSignature(rawBody: string, sigHeader: string | null, webhookSecret: string): boolean {
  if (!sigHeader || !webhookSecret) return false
  const parts = Object.fromEntries(
    sigHeader.split(',').map((kv) => {
      const i = kv.indexOf('=')
      return [kv.slice(0, i), kv.slice(i + 1)]
    }),
  )
  const t = parts['t']
  const v1 = parts['v1']
  if (!t || !v1) return false

  const expected = crypto.createHmac('sha256', webhookSecret).update(`${t}.${rawBody}`).digest('hex')
  // Comparação em tempo constante.
  const a = Buffer.from(expected)
  const b = Buffer.from(v1)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false

  const age = Math.abs(Date.now() / 1000 - Number(t))
  return age < 300
}

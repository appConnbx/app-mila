import { headers } from 'next/headers'

// Rate-limit best-effort em memória (por instância; reinicia em cold start).
// NÃO é fronteira de segurança — é um amortecedor barato contra abuso/custo,
// somado às validações de cada fluxo. Para limites duros, migrar p/ KV/Upstash.
const buckets = new Map<string, number[]>()

export function rateLimit(key: string, opts: { windowMs: number; max: number }): boolean {
  const now = Date.now()
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < opts.windowMs)
  arr.push(now)
  buckets.set(key, arr)
  if (buckets.size > 10_000) buckets.clear() // teto de memória
  return arr.length > opts.max
}

/** IP do cliente em Server Actions / Server Components (via headers da Vercel). */
export async function clientIp(): Promise<string> {
  const h = await headers()
  return (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'anon'
}

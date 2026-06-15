import { headers } from 'next/headers'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate-limit com BARREIRA REAL distribuída (Upstash Redis) quando configurado, e
// FALLBACK best-effort em memória quando não houver Redis. Ativa sozinho assim que
// as envs do Upstash existirem (ex.: integração Upstash na Vercel injeta
// UPSTASH_REDIS_REST_URL/TOKEN ou KV_REST_API_URL/TOKEN). Sem env = comportamento
// atual (amortecedor por instância) — zero risco até ligar.

// ---- Fallback em memória (por instância; reinicia em cold start) ----
const buckets = new Map<string, number[]>()
function memLimited(key: string, windowMs: number, max: number): boolean {
  const now = Date.now()
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  arr.push(now)
  buckets.set(key, arr)
  if (buckets.size > 10_000) buckets.clear() // teto de memória
  return arr.length > max
}

// ---- Upstash (Redis) ----
let redis: Redis | null | undefined
function getRedis(): Redis | null {
  if (redis !== undefined) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  redis = url && token ? new Redis({ url, token }) : null
  return redis
}

const limiters = new Map<string, Ratelimit>()
function getLimiter(windowMs: number, max: number): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  const k = `${max}:${windowMs}`
  let lim = limiters.get(k)
  if (!lim) {
    const seconds = Math.max(1, Math.round(windowMs / 1000))
    lim = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(max, `${seconds} s`),
      prefix: 'mila-rl',
      analytics: false,
    })
    limiters.set(k, lim)
  }
  return lim
}

/** Retorna true quando a chave ESTOUROU o limite (deve bloquear). */
export async function rateLimit(key: string, opts: { windowMs: number; max: number }): Promise<boolean> {
  const lim = getLimiter(opts.windowMs, opts.max)
  if (lim) {
    try {
      const { success } = await lim.limit(key)
      return !success
    } catch {
      // Falha do Redis não derruba o fluxo — cai no amortecedor local.
      return memLimited(key, opts.windowMs, opts.max)
    }
  }
  return memLimited(key, opts.windowMs, opts.max)
}

/** IP do cliente em Server Actions / Server Components (via headers da Vercel). */
export async function clientIp(): Promise<string> {
  const h = await headers()
  return (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'anon'
}

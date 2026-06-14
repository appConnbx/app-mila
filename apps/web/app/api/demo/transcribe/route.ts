import { NextResponse, type NextRequest } from 'next/server'

// Transcrição PÚBLICA para o demo interativo da landing/LPs (sem login).
// Guardas contra custo/abuso: cap de tamanho (~10s de áudio) e rate-limit
// leve por IP (best-effort, em memória). Provider igual ao /api/agent/transcribe.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 1_500_000 // ~1,5MB — 10s de webm/opus fica bem abaixo disso
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 8 // por IP, por minuto (deter abuso; demo são poucos toques)

// Best-effort (reinicia em cold start / é por instância). Não é fronteira de
// segurança — só um amortecedor barato somado ao cap de tamanho.
const hits = new Map<string, number[]>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  arr.push(now)
  hits.set(ip, arr)
  if (hits.size > 5000) hits.clear() // teto de memória
  return arr.length > MAX_PER_WINDOW
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.STT_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'transcrição não configurada' }, { status: 503 })

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'anon'
  if (rateLimited(ip)) return NextResponse.json({ error: 'muitas tentativas' }, { status: 429 })

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof Blob)) return NextResponse.json({ error: 'arquivo ausente' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'áudio muito grande' }, { status: 413 })

  const base = process.env.STT_BASE_URL ?? 'https://api.groq.com/openai/v1'
  const model = process.env.STT_MODEL ?? 'whisper-large-v3-turbo'
  const fd = new FormData()
  fd.append('file', file, 'audio.webm')
  fd.append('model', model)
  fd.append('response_format', 'json')

  const res = await fetch(`${base}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  }).catch(() => null)
  if (!res || !res.ok) return NextResponse.json({ error: 'falha na transcrição' }, { status: 502 })
  const out = (await res.json()) as { text?: string }
  const text = (out.text ?? '').trim()
  if (!text) return NextResponse.json({ error: 'nada reconhecido' }, { status: 422 })
  return NextResponse.json({ text }, { status: 200 })
}

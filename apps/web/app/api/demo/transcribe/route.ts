import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// Transcrição PÚBLICA para o demo interativo da landing/LPs (sem login).
// Guardas contra custo/abuso: cap de tamanho (~10s de áudio) e rate-limit
// leve por IP (best-effort, em memória). Provider igual ao /api/agent/transcribe.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 1_500_000 // ~1,5MB — 10s de webm/opus fica bem abaixo disso

export async function POST(request: NextRequest) {
  const apiKey = process.env.STT_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'transcrição não configurada' }, { status: 503 })

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'anon'
  if (await rateLimit(`demo-transcribe:${ip}`, { windowMs: 60_000, max: 8 })) return NextResponse.json({ error: 'muitas tentativas' }, { status: 429 })

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

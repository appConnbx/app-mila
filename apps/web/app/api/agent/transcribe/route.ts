import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Transcrição de áudio do agente desktop (criação de demanda por voz).
// Auth: Bearer token do Supabase (o agente envia a sessão do usuário).
// Provider: qualquer API compatível com OpenAI (padrão: Groq/Whisper).
// Envs: STT_API_KEY (obrigatória), STT_BASE_URL e STT_MODEL (opcionais).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 15 * 1024 * 1024 // ~15MB (60s de opus fica muito abaixo disso)

export async function POST(request: NextRequest) {
  const apiKey = process.env.STT_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'transcrição não configurada' }, { status: 503 })
  }

  // Usuário autenticado (token de sessão do widget).
  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ error: 'não autenticado' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) {
    return NextResponse.json({ error: 'não autenticado' }, { status: 401 })
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'arquivo ausente' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'áudio muito grande' }, { status: 413 })
  }

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
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'falha na transcrição' }, { status: 502 })
  }
  const out = (await res.json()) as { text?: string }
  const text = (out.text ?? '').trim()
  if (!text) return NextResponse.json({ error: 'nada reconhecido' }, { status: 422 })
  return NextResponse.json({ text })
}

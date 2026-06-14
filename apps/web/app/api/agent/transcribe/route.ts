import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

// Transcrição de áudio do agente desktop (criação de demanda por voz).
// Auth: Bearer token do Supabase (o agente envia a sessão do usuário).
// Provider: qualquer API compatível com OpenAI (padrão: Groq/Whisper).
// Envs: STT_API_KEY (obrigatória), STT_BASE_URL e STT_MODEL (opcionais).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 15 * 1024 * 1024 // ~15MB (60s de opus fica muito abaixo disso)

// CORS: o widget chama esta rota do webview (origem http://tauri.localhost).
// Auth é por header Bearer (sem cookies), então liberar origem é seguro.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
}

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: CORS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.STT_API_KEY
  if (!apiKey) {
    return json({ error: 'transcrição não configurada' }, 503)
  }

  // Usuário autenticado (token de sessão do widget).
  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return json({ error: 'não autenticado' }, 401)
  const admin = createAdminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) {
    return json({ error: 'não autenticado' }, 401)
  }
  // Rate-limit por usuário: a transcrição chama um provider pago (custo/abuso).
  if (rateLimit(`agent-transcribe:${data.user.id}`, { windowMs: 60_000, max: 20 })) {
    return json({ error: 'muitas tentativas' }, 429)
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof Blob)) {
    return json({ error: 'arquivo ausente' }, 400)
  }
  if (file.size > MAX_BYTES) {
    return json({ error: 'áudio muito grande' }, 413)
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
    return json({ error: 'falha na transcrição' }, 502)
  }
  const out = (await res.json()) as { text?: string }
  const text = (out.text ?? '').trim()
  if (!text) return json({ error: 'nada reconhecido' }, 422)
  return json({ text }, 200)
}

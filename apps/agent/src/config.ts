// Valores PÚBLICOS (os mesmos enviados a qualquer navegador que abre appmila.co).
// A segurança vem do RLS/RPCs no banco, nunca destas chaves.
export const SUPABASE_URL = 'https://jqgdexxydtsbcebgvyvh.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_daqXhyvWAQUfS-Gp6mApIg_JZBZTfz2'

// Janela: pílula recolhida e painel expandido (px lógicos).
export const COLLAPSED = { w: 30, h: 200 }
export const EXPANDED = { w: 380, h: 560 }

// Polling leve (1 RPC por ciclo) — 20s para a notificação chegar rápido.
export const POLL_MS = 20_000

// Backend do MILA (rota de transcrição de voz, autenticada por sessão).
export const APP_BASE_URL = 'https://www.appmila.co'

// Gravação de voz: limite de segurança por demanda.
export const MAX_RECORD_MS = 60_000

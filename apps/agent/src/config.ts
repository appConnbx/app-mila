// Valores PÚBLICOS (os mesmos enviados a qualquer navegador que abre appmila.co).
// A segurança vem do RLS/RPCs no banco, nunca destas chaves.
export const SUPABASE_URL = 'https://jqgdexxydtsbcebgvyvh.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_daqXhyvWAQUfS-Gp6mApIg_JZBZTfz2'

// Janela: pílula recolhida, painel completo e mini-painel de voz (px lógicos).
export const COLLAPSED = { w: 30, h: 200 }
export const EXPANDED = { w: 380, h: 560 }
export const MIC = { w: 260, h: 210 }

// Polling leve (1 RPC por ciclo) — 20s para a notificação chegar rápido.
export const POLL_MS = 20_000

// Backend do appMila (rota de transcrição de voz, autenticada por sessão).
export const APP_BASE_URL = 'https://www.appmila.co'

// Gravação de voz (segure-e-fale da pílula): solta ou estoura 10s = cria.
export const MIC_HOLD_MS = 10_000

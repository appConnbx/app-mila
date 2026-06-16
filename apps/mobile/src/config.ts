// Valores PÚBLICOS (mesmos do web/agente). Segurança vem do RLS/RPCs.
export const SUPABASE_URL = 'https://jqgdexxydtsbcebgvyvh.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_daqXhyvWAQUfS-Gp6mApIg_JZBZTfz2'

// Backend do appMila (rota de transcrição de voz, autenticada por sessão).
export const APP_BASE_URL = 'https://www.appmila.co'

// Polling leve da lista (1 RPC por ciclo).
export const POLL_MS = 20_000

// Gravação por voz: solta ou estoura 10s = transcreve.
export const MIC_HOLD_MS = 10_000

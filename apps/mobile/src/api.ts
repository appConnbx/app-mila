import 'react-native-url-polyfill/auto'
import { AppState } from 'react-native'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_BASE_URL } from './config'

// Mesmos RPCs do agente desktop (SECURITY DEFINER por auth.uid):
// lista agregada de todas as instâncias, criação e troca de status.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

// Padrão oficial do Supabase em React Native: o renovador de token só roda
// com o app em primeiro plano (sem isto, o access token vence em 1h e as
// chamadas manuais com Bearer começam a falhar com 401).
supabase.auth.startAutoRefresh()
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh()
  else supabase.auth.stopAutoRefresh()
})

export type Demand = {
  id: string
  holding_id: string
  holding_name: string
  holding_kind: string
  title: string
  description: string | null
  status: 'nova' | 'trabalhando'
  priority: 'baixa' | 'media' | 'alta'
  due_date: string | null
  created_at: string
  pinned: boolean
}

export type DemandStatus = 'nova' | 'trabalhando' | 'finalizada'
export type Holding = { id: string; name: string; kind: string; language: string | null }

export async function fetchPending(): Promise<Demand[]> {
  const { data, error } = await supabase.rpc('agent_pending_demands')
  if (error) throw error
  return (data ?? []) as Demand[]
}

export async function fetchHoldings(): Promise<Holding[]> {
  const { data, error } = await supabase.rpc('agent_holdings')
  if (error) throw error
  return (data ?? []) as Holding[]
}

export async function createDemand(
  holdingId: string,
  title: string,
  description: string | null = null,
  dueDate: string | null = null,
) {
  const { error } = await supabase.rpc('agent_create_demand', {
    p_holding_id: holdingId,
    p_title: title,
    p_description: description,
    p_due_date: dueDate,
    p_priority: 'media',
  })
  if (error) throw error
}

/** Demanda por voz nasce com prazo no dia seguinte. */
export function tomorrowISO(): string {
  const d = new Date(Date.now() + 86_400_000)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dd}`
}

export async function setDemandStatus(demandId: string, status: DemandStatus) {
  const { error } = await supabase.rpc('agent_set_status', {
    p_demand_id: demandId,
    p_status: status,
  })
  if (error) throw error
}

/** Envia o áudio gravado para a rota de transcrição (Bearer da sessão). */
export async function transcribeAudio(uri: string): Promise<string> {
  const send = async (token: string) => {
    const fd = new FormData()
    fd.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' } as unknown as Blob)
    return fetch(`${APP_BASE_URL}/api/agent/transcribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
  }

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('sem-sessao')
  let res = await send(token)
  // Token venceu entre o getSession e o envio: renova e tenta 1x de novo.
  if (res.status === 401) {
    const { data: refreshed } = await supabase.auth.refreshSession()
    const fresh = refreshed.session?.access_token
    if (!fresh) throw new Error('sem-sessao')
    res = await send(fresh)
  }
  if (res.status === 503) throw new Error('nao-configurada')
  if (!res.ok) throw new Error(String(res.status))
  const out = (await res.json()) as { text?: string }
  const text = (out.text ?? '').trim()
  if (!text) throw new Error('vazio')
  return text
}

/** Transcrição longa: começo vira título, texto completo vai na descrição. */
export function splitTranscript(text: string): { title: string; description: string | null } {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length > 180) return { title: clean.slice(0, 177) + '…', description: clean }
  return { title: clean, description: null }
}

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

// Sessão persiste no storage do WebView2 (perfil do app) e renova sozinha —
// o agente é "always-on": sem logout por inatividade (diferente do web).
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
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
  dueDate: string | null,
  description: string | null = null,
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

export async function setDemandStatus(demandId: string, status: DemandStatus) {
  const { error } = await supabase.rpc('agent_set_status', {
    p_demand_id: demandId,
    p_status: status,
  })
  if (error) throw error
}

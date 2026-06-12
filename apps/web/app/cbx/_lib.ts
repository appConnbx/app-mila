import { createClient } from '@/lib/supabase/server'

/** Identidade do operador no portal CBX (master = todas as permissões). */
export type CbxMe = {
  is_staff: boolean
  is_master?: boolean
  full_name?: string
  permissions?: string[]
}

export type CbxPerm = 'CEO' | 'FINANCEIRO' | 'COMERCIAL' | 'SUPORTE' | 'ADMIN'

export async function cbxMe(): Promise<CbxMe> {
  const supabase = await createClient()
  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: CbxMe | null }> }
  const { data } = await sb.rpc('cbx_me')
  return data ?? { is_staff: false }
}

export function hasPerm(me: CbxMe, perm: CbxPerm): boolean {
  return !!me.permissions?.includes(perm)
}

/** Ordem de prioridade das áreas para o redirect da home do portal. */
export const CBX_AREAS: { perm: CbxPerm; href: string; label: string }[] = [
  { perm: 'CEO', href: '/cbx/ceo', label: 'CEO' },
  { perm: 'FINANCEIRO', href: '/cbx/financeiro', label: 'Financeiro' },
  { perm: 'COMERCIAL', href: '/cbx/comercial', label: 'Comercial' },
  { perm: 'SUPORTE', href: '/cbx/suporte', label: 'Suporte' },
  { perm: 'ADMIN', href: '/cbx/admin', label: 'Administração' },
]

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Toda a área de Estrutura é restrita ao ADMINISTRADOR DA HOLDING (admin do
 * sistema). Usuários comuns são redirecionados para as Demandas.
 */
export default async function EstruturaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const rpc = supabase.rpc as unknown as (name: string) => Promise<{ data: boolean | null }>
  const { data: isAdmin } = await rpc('is_holding_admin')
  if (!isAdmin) redirect('/demandas')
  return <>{children}</>
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Atribui/atualiza a licença de uma holding. Guardado no banco por is_platform_admin. */
export async function setLicense(formData: FormData) {
  const holding_id = String(formData.get('holding_id') ?? '')
  const plan_id = String(formData.get('plan_id') ?? '')
  const seatsRaw = String(formData.get('seats') ?? '').trim()
  if (!holding_id || !plan_id) return

  const parsed = parseInt(seatsRaw, 10)
  const seats = seatsRaw === '' || Number.isNaN(parsed) ? null : Math.max(1, parsed)

  const supabase = await createClient()
  const sb = supabase as unknown as {
    rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: { ok: boolean; reason?: string } | null }>
  }
  const { data } = await sb.rpc('admin_set_license', { p_holding: holding_id, p_plan_id: plan_id, p_seats: seats })
  revalidatePath('/admin')
  redirect(data?.ok ? '/admin?ok=applied' : `/admin?err=${data?.reason ?? 'error'}`)
}

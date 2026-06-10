'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const phone = String(formData.get('phone') ?? '').trim() || null
  const headline = String(formData.get('headline') ?? '').trim() || null
  const avatar_url = String(formData.get('avatar_url') ?? '').trim() || null
  const skills = String(formData.get('skills') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20)

  await supabase
    .from('profiles')
    .upsert({ auth_user_id: user.id, phone, headline, avatar_url, skills, updated_at: new Date().toISOString() } as never)

  revalidatePath('/perfil')
  revalidatePath('/dashboard')
}

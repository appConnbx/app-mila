import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditor } from './_editor'

export default async function PerfilPage() {
  const t = await getTranslations('profile')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profData } = await supabase
    .from('profiles')
    .select('avatar_url, phone, headline, skills')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  const prof = profData as unknown as { avatar_url: string | null; phone: string | null; headline: string | null; skills: string[] } | null

  const { data: persData } = await supabase.from('people').select('full_name').eq('auth_user_id', user.id).limit(1)
  const name = (persData as unknown as { full_name: string }[] | null)?.[0]?.full_name ?? user.email?.split('@')[0] ?? 'Usuário'

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-slate-400 transition hover:text-white">← {t('back')}</Link>
      <div className="mt-3">
        <ProfileEditor
          uid={user.id}
          name={name}
          email={user.email ?? ''}
          initial={{
            avatar_url: prof?.avatar_url ?? null,
            phone: prof?.phone ?? null,
            headline: prof?.headline ?? null,
            skills: prof?.skills ?? [],
          }}
        />
      </div>
    </div>
  )
}

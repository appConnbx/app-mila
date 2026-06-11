import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { createArea } from '../../actions'
import { Breadcrumb, Card, ScopeAdmins, StructureSettings, StatusBadge, inputCls, btnCls } from '../../_components'
import { SubmitButton } from '@/components/pending'

type Named = { id: string; name: string; is_active: boolean }
type Person = { id: string; full_name: string }
type Membership = { id: string; person_id: string }

export default async function OrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const t = await getTranslations('structure')
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const { data: orgData } = await supabase.from('organizations').select('id, name, is_active').eq('id', orgId).single()
  const org = orgData as unknown as Named | null
  if (!org) redirect('/estrutura')

  const [areasRes, peopleRes, adminsRes] = await Promise.all([
    supabase.from('areas').select('id, name, is_active').eq('organization_id', orgId).order('name'),
    supabase.from('people').select('id, full_name').eq('is_active', true).order('full_name'),
    supabase.from('memberships').select('id, person_id').eq('role', 'org_admin').eq('scope_id', orgId),
  ])
  const areas = (areasRes.data ?? []) as unknown as Named[]
  const people = (peopleRes.data ?? []) as unknown as Person[]
  const memberships = (adminsRes.data ?? []) as unknown as Membership[]
  const nameOf = (id: string) => people.find((p) => p.id === id)?.full_name ?? '—'
  const admins = memberships.map((m) => ({ id: m.id, person_id: m.person_id, person_name: nameOf(m.person_id) }))

  return (
    <div>
      <Breadcrumb items={[{ href: '/estrutura', label: t('title') }, { label: org.name }]} />
      <div className="mt-3 flex items-center gap-2">
        <h1 className="text-2xl font-bold text-white">{org.name}</h1>
        <StatusBadge active={org.is_active} />
      </div>
      <p className="mt-1 text-sm text-slate-400">{t('orgScope')}</p>

      <div className="mt-6 space-y-5">
        {/* 1) Configurações */}
        <StructureSettings kind="organization" id={orgId} name={org.name} isActive={org.is_active} redirectAfterDelete="/estrutura" />

        {/* 2) Administradores */}
        <ScopeAdmins role="org_admin" scopeLevel="organization" scopeId={orgId} admins={admins} people={people} />

        {/* 3) Áreas (filhos) */}
        <Card title={t('areas')}>
          <ul className="space-y-1.5">
            {areas.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/estrutura/org/${orgId}/area/${a.id}`}
                  className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/60"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{a.name}</span>
                    <StatusBadge active={a.is_active} />
                  </span>
                  <span className="text-xs text-brand">{t('openFolder')} →</span>
                </Link>
              </li>
            ))}
            {areas.length === 0 && <li className="text-sm text-slate-500">{t('none')}</li>}
          </ul>
          <form action={createArea} className="flex gap-2">
            <input type="hidden" name="organization_id" value={orgId} />
            <input name="name" placeholder={t('newArea')} required className={inputCls} />
            <SubmitButton className={btnCls}>{t('add')}</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  )
}

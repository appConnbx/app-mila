import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { addTeamMember, removeTeamMember } from '../../../../../../actions'
import { Breadcrumb, Card, ScopeAdmins, StructureSettings, StatusBadge, inputCls, btnCls } from '../../../../../../_components'
import { SubmitButton } from '@/components/pending'

type Named = { id: string; name: string; is_active: boolean }
type Person = { id: string; full_name: string }
type Membership = { id: string; person_id: string }
type TeamMember = { id: string; person_id: string }

export default async function TeamPage({
  params,
}: {
  params: Promise<{ orgId: string; areaId: string; teamId: string }>
}) {
  const { orgId, areaId, teamId } = await params
  const t = await getTranslations('structure')
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const [orgRes, areaRes, teamRes] = await Promise.all([
    supabase.from('organizations').select('id, name, is_active').eq('id', orgId).single(),
    supabase.from('areas').select('id, name, is_active').eq('id', areaId).single(),
    supabase.from('teams').select('id, name, is_active').eq('id', teamId).single(),
  ])
  const org = orgRes.data as unknown as Named | null
  const area = areaRes.data as unknown as Named | null
  const team = teamRes.data as unknown as Named | null
  if (!org || !area || !team) redirect('/estrutura')

  const [peopleRes, adminsRes, membersRes] = await Promise.all([
    supabase.from('people').select('id, full_name').eq('is_active', true).order('full_name'),
    supabase.from('memberships').select('id, person_id').eq('role', 'team_admin').eq('scope_id', teamId),
    supabase.from('team_members').select('id, person_id').eq('team_id', teamId),
  ])
  const people = (peopleRes.data ?? []) as unknown as Person[]
  const adminRows = (adminsRes.data ?? []) as unknown as Membership[]
  const memberRows = (membersRes.data ?? []) as unknown as TeamMember[]
  const nameOf = (id: string) => people.find((p) => p.id === id)?.full_name ?? '—'
  const admins = adminRows.map((m) => ({ id: m.id, person_id: m.person_id, person_name: nameOf(m.person_id) }))
  const memberIds = new Set(memberRows.map((m) => m.person_id))
  const availableToAdd = people.filter((p) => !memberIds.has(p.id))

  return (
    <div>
      <Breadcrumb
        items={[
          { href: '/estrutura', label: t('title') },
          { href: `/estrutura/org/${orgId}`, label: org.name },
          { href: `/estrutura/org/${orgId}/area/${areaId}`, label: area.name },
          { label: team.name },
        ]}
      />
      <div className="mt-3 flex items-center gap-2">
        <h1 className="text-2xl font-bold text-white">{team.name}</h1>
        <StatusBadge active={team.is_active} />
      </div>
      <p className="mt-1 text-sm text-slate-400">{t('teamScope')}</p>

      <div className="mt-6 space-y-5">
        {/* 1) Configurações */}
        <StructureSettings kind="team" id={teamId} name={team.name} isActive={team.is_active} redirectAfterDelete={`/estrutura/org/${orgId}/area/${areaId}`} />

        {/* 2) Administradores */}
        <ScopeAdmins role="team_admin" scopeLevel="team" scopeId={teamId} admins={admins} people={people} />

        {/* 3) Membros (filhos) */}
        <Card title={t('members')}>
          <ul className="space-y-1.5">
            {memberRows.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200">
                <span>{nameOf(m.person_id)}</span>
                <form action={removeTeamMember}>
                  <input type="hidden" name="id" value={m.id} />
                  <SubmitButton className="text-xs text-slate-500 transition hover:text-red-400">{t('remove')}</SubmitButton>
                </form>
              </li>
            ))}
            {memberRows.length === 0 && <li className="text-sm text-slate-500">{t('noMembers')}</li>}
          </ul>
          {availableToAdd.length > 0 && (
            <form action={addTeamMember} className="flex gap-2">
              <input type="hidden" name="team_id" value={teamId} />
              <select name="person_id" required defaultValue="" className={inputCls}>
                <option value="" disabled>{t('selectPerson')}</option>
                {availableToAdd.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
              <SubmitButton className={btnCls}>{t('addMember')}</SubmitButton>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

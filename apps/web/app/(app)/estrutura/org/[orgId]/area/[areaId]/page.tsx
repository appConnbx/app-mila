import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { createTeam } from '../../../../actions'
import { Breadcrumb, Card, ScopeAdmins, inputCls, btnCls } from '../../../../_components'

type Named = { id: string; name: string }
type Person = { id: string; full_name: string }
type Membership = { id: string; person_id: string }

export default async function AreaPage({ params }: { params: Promise<{ orgId: string; areaId: string }> }) {
  const { orgId, areaId } = await params
  const t = await getTranslations('structure')
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const [orgRes, areaRes] = await Promise.all([
    supabase.from('organizations').select('id, name').eq('id', orgId).single(),
    supabase.from('areas').select('id, name').eq('id', areaId).single(),
  ])
  const org = orgRes.data as unknown as Named | null
  const area = areaRes.data as unknown as Named | null
  if (!org || !area) redirect('/estrutura')

  const [teamsRes, peopleRes, adminsRes] = await Promise.all([
    supabase.from('teams').select('id, name').eq('area_id', areaId).order('name'),
    supabase.from('people').select('id, full_name').order('full_name'),
    supabase.from('memberships').select('id, person_id').eq('role', 'area_admin').eq('scope_id', areaId),
  ])
  const teams = (teamsRes.data ?? []) as unknown as Named[]
  const people = (peopleRes.data ?? []) as unknown as Person[]
  const memberships = (adminsRes.data ?? []) as unknown as Membership[]
  const nameOf = (id: string) => people.find((p) => p.id === id)?.full_name ?? '—'
  const admins = memberships.map((m) => ({ id: m.id, person_id: m.person_id, person_name: nameOf(m.person_id) }))

  return (
    <div>
      <Breadcrumb
        items={[
          { href: '/estrutura', label: t('title') },
          { href: `/estrutura/org/${orgId}`, label: org.name },
          { label: area.name },
        ]}
      />
      <h1 className="mt-3 text-2xl font-bold text-white">{area.name}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('areaScope')}</p>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
        <Card title={t('teams')}>
          <ul className="space-y-1.5">
            {teams.map((tm) => (
              <li key={tm.id}>
                <Link
                  href={`/estrutura/org/${orgId}/area/${areaId}/team/${tm.id}`}
                  className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/60"
                >
                  <span className="font-medium">{tm.name}</span>
                  <span className="text-xs text-brand">{t('openFolder')} →</span>
                </Link>
              </li>
            ))}
            {teams.length === 0 && <li className="text-sm text-slate-500">{t('none')}</li>}
          </ul>
          <form action={createTeam} className="flex gap-2">
            <input type="hidden" name="area_id" value={areaId} />
            <input name="name" placeholder={t('newTeam')} required className={inputCls} />
            <button type="submit" className={btnCls}>{t('add')}</button>
          </form>
        </Card>

        <ScopeAdmins role="area_admin" scopeLevel="area" scopeId={areaId} admins={admins} people={people} />
      </div>
    </div>
  )
}

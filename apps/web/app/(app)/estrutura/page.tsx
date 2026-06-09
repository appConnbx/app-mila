import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { createOrganization } from './actions'
import { Card, PeopleManager, inputCls, btnCls } from './_components'

type Org = { id: string; name: string }
type Holding = { id: string; name: string; kind: 'corporate' | 'family' }
type Alias = { id: string; alias: string; person_id: string }
type Person = {
  id: string
  full_name: string
  role_title: string | null
  email: string | null
  can_delegate: boolean
  organization_id: string
}

async function loadPeople(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [peopleRes, aliasRes] = await Promise.all([
    supabase.from('people').select('id, full_name, role_title, email, can_delegate, organization_id').order('full_name'),
    supabase.from('person_aliases').select('id, alias, person_id'),
  ])
  const people = (peopleRes.data ?? []) as unknown as Person[]
  const aliases = (aliasRes.data ?? []) as unknown as Alias[]
  return people.map((p) => ({
    ...p,
    aliases: aliases.filter((a) => a.person_id === p.id).map((a) => ({ id: a.id, alias: a.alias })),
  }))
}

export default async function EstruturaPage() {
  const t = await getTranslations('structure')
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const { data: holdingData } = await supabase.from('holdings').select('id, name, kind').eq('id', holdingId).single()
  const holding = holdingData as unknown as Holding | null

  const { data: orgsData } = await supabase.from('organizations').select('id, name').order('name')
  const orgs = (orgsData ?? []) as unknown as Org[]
  const people = await loadPeople(supabase)

  // ----------------------------------------------------------------- FAMÍLIA
  if (holding?.kind === 'family') {
    const defaultOrgId = orgs[0]?.id
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-white">{t('familyTitle')}</h1>
        <p className="mt-1 text-sm text-slate-400">{t('familyDesc')}</p>
        <div className="mt-6">
          <PeopleManager people={people} defaultOrgId={defaultOrgId} />
        </div>
      </div>
    )
  }

  // ------------------------------------------------------------- CORPORATIVO
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{holding?.name}</p>
        </div>
        <Link
          href="/estrutura/holding"
          className="rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          {t('holdingMgmt')}
        </Link>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
        <Card title={t('orgs')}>
          <ul className="space-y-1.5">
            {orgs.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/estrutura/org/${o.id}`}
                  className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800/60"
                >
                  <span className="font-medium">{o.name}</span>
                  <span className="text-xs text-brand">{t('openFolder')} →</span>
                </Link>
              </li>
            ))}
            {orgs.length === 0 && <li className="text-sm text-slate-500">{t('none')}</li>}
          </ul>
          <form action={createOrganization} className="flex gap-2">
            <input name="name" placeholder={t('newOrg')} required className={inputCls} />
            <button type="submit" className={btnCls}>{t('add')}</button>
          </form>
        </Card>

        <PeopleManager people={people} orgs={orgs} />
      </div>
    </div>
  )
}

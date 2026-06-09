import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { createOrganization } from './actions'
import { PeopleManager, StatusBadge, inputCls, btnCls } from './_components'

type Org = { id: string; name: string; is_active: boolean }
type Holding = { id: string; name: string; kind: 'corporate' | 'family' }
type Alias = { id: string; alias: string; person_id: string }
type Person = {
  id: string
  full_name: string
  role_title: string | null
  email: string | null
  can_delegate: boolean
  is_active: boolean
  organization_id: string
}

async function loadPeople(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [peopleRes, aliasRes] = await Promise.all([
    supabase.from('people').select('id, full_name, role_title, email, can_delegate, is_active, organization_id').order('full_name'),
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

  const { data: orgsData } = await supabase.from('organizations').select('id, name, is_active').order('name')
  const orgs = (orgsData ?? []) as unknown as Org[]

  // ----------------------------------------------------------------- FAMÍLIA
  if (holding?.kind === 'family') {
    const people = await loadPeople(supabase)
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
  const activeOrgs = orgs.filter((o) => o.is_active).length
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t('title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{holding?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/estrutura/usuarios"
            className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
          >
            {t('usersMgmt')}
          </Link>
          <Link
            href="/estrutura/holding"
            className="rounded-lg border border-white/10 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10"
          >
            {t('holdingMgmt')}
          </Link>
        </div>
      </div>

      {/* Criar organização */}
      <form action={createOrganization} className="mt-6 flex flex-wrap items-center gap-2">
        <input name="name" placeholder={t('newOrg')} required className={`${inputCls} max-w-xs flex-1`} />
        <button type="submit" className={btnCls}>{t('add')}</button>
      </form>

      {/* Data grid de organizações */}
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('orgs')}</h2>
        <span className="text-xs text-slate-500">{activeOrgs}/{orgs.length}</span>
      </div>
      <div className="mt-2 glass overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('orgs')}</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('colStatus')}</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className={`border-b border-white/5 last:border-0 transition hover:bg-white/[0.025] ${o.is_active ? '' : 'opacity-55'}`}>
                <td className="px-4 py-3">
                  <Link href={`/estrutura/org/${o.id}`} className="font-semibold text-slate-100 transition hover:text-brand">{o.name}</Link>
                </td>
                <td className="px-4 py-3"><StatusBadge active={o.is_active} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/estrutura/org/${o.id}`} className="text-xs font-semibold text-brand transition hover:text-brand-500">{t('openFolder')} →</Link>
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-500">{t('none')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

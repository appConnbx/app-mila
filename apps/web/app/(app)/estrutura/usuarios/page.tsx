import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { ConfirmButton } from '@/components/confirm-button'
import { Breadcrumb, Card, StatusBadge, inputCls, btnCls } from '../_components'
import { createPerson, setHoldingAdmin, setPersonActive, deletePerson, sendPasswordReset } from '../actions'

type HoldingUser = {
  id: string
  full_name: string
  email: string | null
  role_title: string | null
  is_active: boolean
  can_delegate: boolean
  is_admin: boolean
  teams: string[]
  last_sign_in_at: string | null
  has_active_session: boolean
}
type Org = { id: string; name: string }

export default async function UsuariosPage() {
  const t = await getTranslations('structure')
  const locale = await getLocale()
  const supabase = await createClient()

  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: HoldingUser[] | null }> }
  const { data } = await sb.rpc('holding_users')
  const users = data ?? []

  const { data: orgsData } = await supabase.from('organizations').select('id, name').eq('is_active', true).order('name')
  const orgs = (orgsData ?? []) as unknown as Org[]

  const fmt = (iso: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return `${d.toLocaleDateString(locale)} ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
  }

  const thCls = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500'
  const tdCls = 'px-3 py-2.5 align-top'

  return (
    <div>
      <Breadcrumb items={[{ href: '/estrutura', label: t('title') }, { label: t('usersMgmt') }]} />
      <h1 className="mt-3 text-2xl font-bold text-white">{t('usersMgmt')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('usersMgmtDesc')}</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-surface-border bg-surface-card shadow-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className={thCls}>{t('colUser')}</th>
              <th className={thCls}>{t('colTeams')}</th>
              <th className={thCls}>{t('colLastLogin')}</th>
              <th className={thCls}>{t('colSession')}</th>
              <th className={thCls}>{t('colStatus')}</th>
              <th className={thCls}>{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-b border-surface-border/60 last:border-0 ${u.is_active ? '' : 'opacity-60'}`}>
                <td className={tdCls}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100">{u.full_name}</span>
                    {u.is_admin && (
                      <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-medium text-brand">{t('adminBadge')}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{u.email ?? '—'}</p>
                </td>
                <td className={`${tdCls} text-slate-300`}>
                  {u.teams.length ? u.teams.join(', ') : <span className="text-slate-600">—</span>}
                </td>
                <td className={`${tdCls} text-slate-400`}>{fmt(u.last_sign_in_at)}</td>
                <td className={tdCls}>
                  {u.has_active_session ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {t('sessionActive')}
                    </span>
                  ) : (
                    <span className="text-slate-600">{t('sessionNone')}</span>
                  )}
                </td>
                <td className={tdCls}><StatusBadge active={u.is_active} /></td>
                <td className={tdCls}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                    <form action={setHoldingAdmin}>
                      <input type="hidden" name="person_id" value={u.id} />
                      <input type="hidden" name="make" value={u.is_admin ? '0' : '1'} />
                      <button type="submit" className="text-slate-400 transition hover:text-brand">
                        {u.is_admin ? t('removeAdminRole') : t('makeAdmin')}
                      </button>
                    </form>
                    <form action={setPersonActive}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="active" value={u.is_active ? '0' : '1'} />
                      <button type="submit" className="text-slate-400 transition hover:text-white">
                        {u.is_active ? t('deactivate') : t('activate')}
                      </button>
                    </form>
                    {u.email && (
                      <form action={sendPasswordReset}>
                        <input type="hidden" name="email" value={u.email} />
                        <button type="submit" className="text-slate-400 transition hover:text-white">{t('resetPassword')}</button>
                      </form>
                    )}
                    <form action={deletePerson}>
                      <input type="hidden" name="id" value={u.id} />
                      <ConfirmButton message={t('confirmDeletePerson')} className="text-slate-500 transition hover:text-red-400">
                        {t('delete')}
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-500">{t('none')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cadastrar novo usuário */}
      <div className="mt-6 max-w-xl">
        <Card title={t('addPerson')}>
          <form action={createPerson} className="space-y-2">
            <select name="organization_id" required defaultValue="" className={inputCls}>
              <option value="" disabled>{t('orgPlaceholder')}</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <input name="full_name" required placeholder={t('fullName')} className={inputCls} />
            <input name="email" type="email" placeholder={t('emailOptional')} className={inputCls} />
            <input name="role_title" placeholder={t('roleOptional')} className={inputCls} />
            <input name="aliases" placeholder={t('aliasesPlaceholder')} className={inputCls} />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="can_delegate" className="h-4 w-4 rounded border-surface-border bg-slate-900" />
              {t('canDelegate')}
            </label>
            <button type="submit" className={btnCls}>{t('addPerson')}</button>
          </form>
        </Card>
      </div>
    </div>
  )
}

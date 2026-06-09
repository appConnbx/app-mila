import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb, Card, inputCls, btnCls } from '../_components'
import { createPerson } from '../actions'
import { UsersManager, type HoldingUser } from './_users-manager'

type Org = { id: string; name: string }

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const t = await getTranslations('structure')
  const { ok, err } = await searchParams
  const supabase = await createClient()

  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: HoldingUser[] | null }> }
  const { data } = await sb.rpc('holding_users')
  const users = data ?? []

  const { data: orgsData } = await supabase.from('organizations').select('id, name').eq('is_active', true).order('name')
  const orgs = (orgsData ?? []) as unknown as Org[]

  const flash = ok === 'deleted'
    ? { kind: 'ok' as const, text: t('msgDeleted') }
    : err === 'has_dependencies'
      ? { kind: 'err' as const, text: t('msgHasDeps') }
      : err
        ? { kind: 'err' as const, text: t('msgDeleteError') }
        : undefined

  return (
    <div>
      <Breadcrumb items={[{ href: '/estrutura', label: t('title') }, { label: t('usersMgmt') }]} />
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">{t('usersMgmt')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('usersMgmtDesc')}</p>

      <div className="mt-6">
        <UsersManager users={users} flash={flash} />
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

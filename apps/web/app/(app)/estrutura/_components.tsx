import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ConfirmButton } from '@/components/confirm-button'
import { Badge, fieldClasses } from '@/components/ui'
import {
  assignAdmin,
  removeAdmin,
  createPerson,
  addAlias,
  removeAlias,
  renameStructure,
  setStructureActive,
  deleteStructure,
  setPersonActive,
  deletePerson,
} from './actions'

export async function StatusBadge({ active }: { active: boolean }) {
  const t = await getTranslations('structure')
  return <Badge variant={active ? 'success' : 'neutral'}>{active ? t('active') : t('inactive')}</Badge>
}

export const inputCls = fieldClasses
export const btnCls =
  'shrink-0 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500'

export function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {action}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

type Crumb = { href?: string; label: string }
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {it.href ? (
            <Link href={it.href} className="transition hover:text-white">{it.label}</Link>
          ) : (
            <span className="font-medium text-slate-200">{it.label}</span>
          )}
          {i < items.length - 1 && <span className="text-slate-600">/</span>}
        </span>
      ))}
    </nav>
  )
}

type Admin = { id: string; person_id: string; person_name: string }
type Person = { id: string; full_name: string }

/** Administradores responsáveis por um escopo (org/área/equipe). Permite 1+ admins. */
export async function ScopeAdmins({
  role,
  scopeLevel,
  scopeId,
  admins,
  people,
}: {
  role: 'org_admin' | 'area_admin' | 'team_admin'
  scopeLevel: 'organization' | 'area' | 'team'
  scopeId: string
  admins: Admin[]
  people: Person[]
}) {
  const t = await getTranslations('structure')
  const adminIds = new Set(admins.map((a) => a.person_id))
  const available = people.filter((p) => !adminIds.has(p.id))

  return (
    <Card title={t('admins')}>
      <ul className="space-y-1.5">
        {admins.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-sm text-slate-200">
            <span>{a.person_name}</span>
            <form action={removeAdmin}>
              <input type="hidden" name="id" value={a.id} />
              <button type="submit" className="text-xs text-slate-500 transition hover:text-red-400">
                {t('remove')}
              </button>
            </form>
          </li>
        ))}
        {admins.length === 0 && <li className="text-sm text-slate-500">{t('noAdmins')}</li>}
      </ul>
      {available.length > 0 && (
        <form action={assignAdmin} className="flex gap-2">
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="scope_level" value={scopeLevel} />
          <input type="hidden" name="scope_id" value={scopeId} />
          <select name="person_id" required defaultValue="" className={inputCls}>
            <option value="" disabled>{t('selectPerson')}</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
          <button type="submit" className={btnCls}>{t('addAdmin')}</button>
        </form>
      )}
    </Card>
  )
}

type Alias = { id: string; alias: string }
type FullPerson = {
  id: string
  full_name: string
  role_title: string | null
  email: string | null
  can_delegate: boolean
  is_active: boolean
  aliases: Alias[]
}

/** Cadastro de pessoas (nome, apelidos, e-mail, pode delegar). */
export async function PeopleManager({
  people,
  orgs,
  defaultOrgId,
}: {
  people: FullPerson[]
  orgs?: { id: string; name: string }[]
  defaultOrgId?: string
}) {
  const t = await getTranslations('structure')
  return (
    <Card title={t('people')}>
      <ul className="space-y-2">
        {people.map((p) => (
          <li key={p.id} className={`rounded-lg bg-slate-900/40 px-3 py-2 ${p.is_active ? '' : 'opacity-60'}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-100">
                <span className="font-medium">{p.full_name}</span>
                {p.role_title && <span className="text-slate-500"> · {p.role_title}</span>}
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                {p.can_delegate && (
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-medium text-brand">
                    {t('canDelegateBadge')}
                  </span>
                )}
                <StatusBadge active={p.is_active} />
              </div>
            </div>
            {p.email && <p className="mt-0.5 text-xs text-slate-500">{p.email}</p>}
            <div className="mt-1 flex items-center gap-3 text-[11px]">
              <form action={setPersonActive}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="active" value={p.is_active ? '0' : '1'} />
                <button type="submit" className="text-slate-400 transition hover:text-white">
                  {p.is_active ? t('deactivate') : t('activate')}
                </button>
              </form>
              <form action={deletePerson}>
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton message={t('confirmDeletePerson')} className="text-slate-500 transition hover:text-red-400">
                  {t('delete')}
                </ConfirmButton>
              </form>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {p.aliases.map((al) => (
                <span key={al.id} className="inline-flex items-center gap-1 rounded-full border border-surface-border bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-300">
                  {al.alias}
                  <form action={removeAlias} className="inline">
                    <input type="hidden" name="id" value={al.id} />
                    <button type="submit" className="text-slate-500 transition hover:text-red-400">×</button>
                  </form>
                </span>
              ))}
              <form action={addAlias} className="inline-flex items-center gap-1">
                <input type="hidden" name="person_id" value={p.id} />
                <input
                  name="alias"
                  placeholder={t('addAliasPlaceholder')}
                  className="w-24 rounded-full border border-surface-border bg-slate-900/60 px-2 py-0.5 text-[11px] text-slate-200 outline-none focus:border-brand"
                />
                <button type="submit" className="text-xs font-semibold text-brand">+</button>
              </form>
            </div>
          </li>
        ))}
        {people.length === 0 && <li className="text-sm text-slate-500">{t('none')}</li>}
      </ul>

      <form action={createPerson} className="space-y-2 border-t border-surface-border pt-4">
        {orgs ? (
          <select name="organization_id" required defaultValue="" className={inputCls}>
            <option value="" disabled>{t('orgPlaceholder')}</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        ) : (
          <input type="hidden" name="organization_id" value={defaultOrgId ?? ''} />
        )}
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
  )
}

/** Configurações de uma estrutura (renomear, desativar/ativar, excluir). */
export async function StructureSettings({
  kind,
  id,
  name,
  isActive,
  redirectAfterDelete,
}: {
  kind: 'organization' | 'area' | 'team'
  id: string
  name: string
  isActive: boolean
  redirectAfterDelete: string
}) {
  const t = await getTranslations('structure')
  return (
    <Card title={t('settings')}>
      <form action={renameStructure} className="flex gap-2">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="id" value={id} />
        <input name="name" defaultValue={name} required className={inputCls} />
        <button type="submit" className={btnCls}>{t('save')}</button>
      </form>
      <div className="flex items-center gap-2">
        <form action={setStructureActive}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="active" value={isActive ? '0' : '1'} />
          <button type="submit" className="rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800">
            {isActive ? t('deactivate') : t('activate')}
          </button>
        </form>
        <form action={deleteStructure}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="redirect" value={redirectAfterDelete} />
          <ConfirmButton
            message={t('confirmDelete')}
            className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
          >
            {t('delete')}
          </ConfirmButton>
        </form>
      </div>
    </Card>
  )
}

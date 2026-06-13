import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cbxMe, hasPerm } from '../../_lib'
import { CbxCard, CbxFlash, Kpi, Pill, btnCbx, inputCbx, labelCbx, fmtDate } from '../../_ui'
import { ClientProfileForm } from '../_profile-form'
import { PasswordField } from '../../_password-field'
import { saveProfile, addNote, setLicense, cbxSetUserActive, cbxSetUserPassword } from '../actions'

type InstanceUser = {
  id: string; full_name: string; email: string | null; role_title: string | null
  is_active: boolean; is_admin: boolean; has_login: boolean; last_sign_in_at: string | null
}

type Detail = {
  ok: boolean
  holding: {
    id: string; name: string; kind: string; status: string
    legal_name: string | null; tax_id: string | null
    contact_email: string | null; phone: string | null
    billing_email: string | null; created_at: string
  } | null
  license: {
    plan_id: string | null; plan_name: string | null; provider: string | null
    status: string | null; seats: number | null; max_users: number | null
    seat_limit: number | null; is_unlimited: boolean
    current_period_end: string | null; external_subscription_code: string | null
  } | null
  used: number
  profile: {
    business_type: string | null; country: string | null; state: string | null; city: string | null
    contact_name: string | null; contact_email: string | null; contact_phone: string | null
    updated_by: string | null; updated_at: string | null
  } | null
  notes: { id: string; author: string; body: string; created_at: string }[]
}

type Plan = { id: string; name: string; account_kind: string; provider: string; max_users: number | null }

const FLASH: Record<string, { ok?: string; err?: string }> = {
  perfil: { ok: 'Cadastro atualizado.' },
  nota: { ok: 'Anotação registrada.' },
  licenca: { ok: 'Licença atualizada.' },
  criado: { ok: 'Cliente criado com sucesso. Repasse o acesso ao administrador.' },
  user: { ok: 'Usuário atualizado.' },
  pw: { ok: 'Senha definida. Repasse ao usuário.' },
  pwshort: { err: 'A senha precisa ter ao menos 6 caracteres.' },
  pwfail: { err: 'Não foi possível definir a senha.' },
  noemail: { err: 'Cadastre um e-mail para o usuário antes de definir a senha.' },
  forbidden: { err: 'Sem permissão para esta ação.' },
  erro: { err: 'Não deu certo. Tente novamente.' },
}

export default async function FichaClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ holdingId: string }>
  searchParams: Promise<{ ok?: string; err?: string }>
}) {
  const me = await cbxMe()
  if (!me.is_staff || !(hasPerm(me, 'COMERCIAL') || hasPerm(me, 'CEO') || hasPerm(me, 'SUPORTE'))) notFound()
  const { holdingId } = await params
  const { ok, err } = await searchParams
  const flash = FLASH[ok ?? err ?? ''] ?? {}
  const canEdit = hasPerm(me, 'COMERCIAL')

  const supabase = await createClient()
  const sb = supabase as unknown as { rpc: (n: string, a?: Record<string, unknown>) => Promise<{ data: unknown }> }
  const [detailRes, plansRes, typesRes, usersRes] = await Promise.all([
    sb.rpc('cbx_client_detail', { p_holding: holdingId }),
    sb.rpc('admin_list_plans'),
    sb.rpc('cbx_list_business_types', { p_all: false }),
    sb.rpc('cbx_holding_users', { p_holding: holdingId }),
  ])
  const d = detailRes.data as Detail | null
  if (!d?.ok || !d.holding) notFound()
  const plans = (plansRes.data as Plan[] | null) ?? []
  const businessTypes = ((typesRes.data as { name: string }[] | null) ?? []).map((b) => b.name)
  const users = (usersRes.data as InstanceUser[] | null) ?? []
  const canManageUsers = hasPerm(me, 'SUPORTE') || hasPerm(me, 'COMERCIAL')
  const h = d.holding
  const lic = d.license
  const p = d.profile

  const planLabel = (pl: Plan) =>
    `${pl.name} · ${pl.account_kind === 'family' ? 'Família' : 'Corporativo'} ${pl.max_users == null ? '(∞)' : `(${pl.max_users})`}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/cbx/comercial" className="text-sm text-slate-500 hover:text-white">← Comercial</Link>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">{h.name}</h1>
            <Pill>{h.kind === 'family' ? 'Família' : 'Corporativo'}</Pill>
            {lic?.is_unlimited && <Pill tone="warn">VIP CONNBX</Pill>}
          </div>
          <p className="mt-1 text-xs text-slate-500">Cliente desde {fmtDate(h.created_at)}</p>
        </div>
      </div>

      <CbxFlash {...flash} />

      {/* Licença */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Plano" value={lic?.plan_name ?? 'Sem plano'} />
        <Kpi label="Limite" value={lic ? (lic.is_unlimited ? 'Ilimitado' : lic.seat_limit) : '—'} />
        <Kpi label="Em uso" value={d.used} />
        <Kpi
          label="Status"
          value={lic?.status ?? '—'}
          tone={lic?.status === 'active' ? 'ok' : 'warn'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enriquecimento do cadastro */}
        <CbxCard title="Cadastro e inteligência de negócio">
          {canEdit ? (
            <>
              <ClientProfileForm
                holdingId={h.id}
                businessTypes={businessTypes}
                action={saveProfile}
                initial={{
                  business_type: p?.business_type ?? null,
                  country: p?.country ?? null,
                  state: p?.state ?? null,
                  city: p?.city ?? null,
                  contact_name: p?.contact_name ?? null,
                  contact_email: p?.contact_email ?? null,
                  contact_phone: p?.contact_phone ?? null,
                }}
              />
              {p?.updated_by && (
                <p className="mt-2 text-xs text-slate-500">Atualizado por {p.updated_by} em {fmtDate(p.updated_at)}</p>
              )}
            </>
          ) : (
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Tipo de negócio</dt><dd className="text-slate-200">{p?.business_type ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Região</dt><dd className="text-slate-200">{[p?.city, p?.state, p?.country].filter(Boolean).join(' / ') || '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Contato</dt><dd className="text-slate-200">{p?.contact_name ?? '—'}</dd></div>
            </dl>
          )}
        </CbxCard>

        <div className="space-y-6">
          {/* Licenciamento manual */}
          {canEdit && (
            <CbxCard title="Licenciamento">
              <form action={setLicense} className="space-y-3">
                <input type="hidden" name="holding_id" value={h.id} />
                <div>
                  <label className={labelCbx}>Plano</label>
                  <select name="plan_id" defaultValue={lic?.plan_id ?? ''} required className={`mt-1 ${inputCbx}`}>
                    <option value="" disabled>Escolha o plano</option>
                    {plans.map((pl) => (
                      <option key={pl.id} value={pl.id}>{planLabel(pl)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCbx}>Limite personalizado (opcional)</label>
                  <input name="seats" type="number" min={1} placeholder="—" className={`mt-1 ${inputCbx}`} />
                  <p className="mt-1 text-xs text-slate-500">Em branco = limite do plano. VIP CONNBX = ilimitado e vitalício.</p>
                </div>
                <button className={btnCbx}>Aplicar licença</button>
              </form>
            </CbxCard>
          )}

          {/* Dados da conta */}
          <CbxCard title="Dados da conta">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Razão social</dt><dd className="text-slate-200">{h.legal_name ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">CNPJ/CPF</dt><dd className="text-slate-200">{h.tax_id ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">E-mail da conta</dt><dd className="text-slate-200">{h.contact_email ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">E-mail de cobrança</dt><dd className="text-slate-200">{h.billing_email ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Telefone</dt><dd className="text-slate-200">{h.phone ?? '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Assinatura externa</dt><dd className="text-slate-200">{lic?.external_subscription_code ?? '—'}</dd></div>
            </dl>
          </CbxCard>
        </div>
      </div>

      {/* Histórico de conversas */}
      <CbxCard title="Histórico de conversas e anotações">
        <form action={addNote} className="mb-4 flex gap-2">
          <input type="hidden" name="holding_id" value={h.id} />
          <input name="body" required placeholder="Registrar conversa, combinado ou observação…" className={inputCbx} />
          <button className={`${btnCbx} shrink-0`}>Registrar</button>
        </form>
        <ul className="space-y-2">
          {d.notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-slate-900/40 px-3 py-2">
              <p className="text-sm text-slate-200">{n.body}</p>
              <p className="mt-1 text-xs text-slate-500">{n.author} · {fmtDate(n.created_at)}</p>
            </li>
          ))}
          {d.notes.length === 0 && <li className="text-sm text-slate-500">Nenhuma anotação ainda.</li>}
        </ul>
      </CbxCard>

      {/* Usuários da instância (super admin) */}
      <CbxCard title={`Usuários da instância (${users.length})`}>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className={`rounded-xl border border-white/10 bg-slate-900/40 p-3 ${u.is_active ? '' : 'opacity-60'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {u.full_name} {u.is_admin && <Pill tone="info">admin</Pill>}
                  </p>
                  <p className="text-xs text-slate-500">{u.email ?? 'sem e-mail'} · {u.has_login ? 'tem acesso' : 'sem login'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Pill tone={u.is_active ? 'ok' : undefined}>{u.is_active ? 'Ativo' : 'Inativo'}</Pill>
                  {canManageUsers && (
                    <form action={cbxSetUserActive}>
                      <input type="hidden" name="holding_id" value={h.id} />
                      <input type="hidden" name="person_id" value={u.id} />
                      <input type="hidden" name="active" value={u.is_active ? '0' : '1'} />
                      <button className="text-xs text-slate-400 underline-offset-2 transition hover:text-white hover:underline">
                        {u.is_active ? 'Desativar' : 'Reativar'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
              {canManageUsers && u.email && (
                <form action={cbxSetUserPassword} className="mt-2 flex items-end gap-2 border-t border-white/5 pt-2">
                  <input type="hidden" name="holding_id" value={h.id} />
                  <input type="hidden" name="person_id" value={u.id} />
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase tracking-wide text-slate-500">Definir senha (super admin)</label>
                    <div className="mt-1"><PasswordField placeholder="Nova senha (mín. 6)" /></div>
                  </div>
                  <button className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10">
                    Definir
                  </button>
                </form>
              )}
            </div>
          ))}
          {users.length === 0 && <p className="text-sm text-slate-500">Nenhum usuário nesta instância.</p>}
        </div>
      </CbxCard>
    </div>
  )
}

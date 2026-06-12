import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cbxMe, hasPerm } from '../_lib'
import { CbxCard, Pill, btnCbx, thCbx, tdCbx } from '../_ui'

export type ClientRow = {
  holding_id: string
  name: string
  kind: 'corporate' | 'family'
  holding_status: string
  plan_id: string | null
  plan_name: string | null
  seat_limit: number | null
  used: number | null
  is_unlimited: boolean
  sub_status: string | null
  provider: string | null
  business_type: string | null
  city: string | null
  state: string | null
  country: string | null
  contact_name: string | null
  created_at: string
}

export default async function CbxComercialPage() {
  const me = await cbxMe()
  if (!me.is_staff || !(hasPerm(me, 'COMERCIAL') || hasPerm(me, 'CEO'))) notFound()

  const supabase = await createClient()
  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: ClientRow[] | null }> }
  const { data } = await sb.rpc('cbx_list_clients')
  const clients = data ?? []

  const region = (c: ClientRow) =>
    [c.city, c.state, c.country].filter(Boolean).join(' / ') || '—'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Comercial</h1>
          <p className="mt-1 text-sm text-slate-400">
            {clients.length} cliente(s). Clique para abrir a ficha: cadastro, histórico e licença.
          </p>
        </div>
        {hasPerm(me, 'COMERCIAL') && (
          <Link href="/cbx/comercial/novo" className={btnCbx}>
            + Cliente manual
          </Link>
        )}
      </div>

      <CbxCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className={thCbx}>Cliente</th>
                <th className={thCbx}>Plano</th>
                <th className={thCbx}>Uso</th>
                <th className={thCbx}>Tipo de negócio</th>
                <th className={thCbx}>Região</th>
                <th className={thCbx}>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.holding_id} className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]">
                  <td className={tdCbx}>
                    <Link href={`/cbx/comercial/${c.holding_id}`} className="font-semibold text-slate-100 hover:text-amber-300">
                      {c.name}
                    </Link>
                    <p className="text-xs text-slate-500">{c.kind === 'family' ? 'Família' : 'Corporativo'}</p>
                  </td>
                  <td className={tdCbx}>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200">{c.plan_name ?? '—'}</span>
                      {c.is_unlimited && <Pill tone="warn">VIP</Pill>}
                    </div>
                    <p className="text-xs text-slate-500">{c.provider ?? ''}</p>
                  </td>
                  <td className={tdCbx}>
                    <span className="text-slate-200">
                      {c.used ?? 0} / {c.is_unlimited ? '∞' : c.seat_limit ?? '—'}
                    </span>
                  </td>
                  <td className={`${tdCbx} text-slate-300`}>{c.business_type ?? '—'}</td>
                  <td className={`${tdCbx} text-slate-300`}>{region(c)}</td>
                  <td className={tdCbx}>
                    <Pill tone={c.sub_status === 'active' ? 'ok' : c.sub_status ? 'warn' : 'err'}>
                      {c.sub_status ?? 'sem licença'}
                    </Pill>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    Nenhum cliente ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CbxCard>
    </div>
  )
}

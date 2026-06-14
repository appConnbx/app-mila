import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cbxMe, hasPerm } from '../_lib'
import { btnCbx } from '../_ui'
import { ComercialList } from './_list'

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
  price_cents: number | null
  currency: string | null
  billing_interval: string | null
}

export default async function CbxComercialPage() {
  const me = await cbxMe()
  if (!me.is_staff || !(hasPerm(me, 'COMERCIAL') || hasPerm(me, 'CEO'))) notFound()

  const supabase = await createClient()
  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: ClientRow[] | null }> }
  const { data } = await sb.rpc('cbx_list_clients')
  const clients = data ?? []

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
          <div className="flex gap-2">
            <Link href="/cbx/comercial/tipos" className="inline-flex items-center justify-center rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white">
              Tipos de negócio
            </Link>
            <Link href="/cbx/comercial/novo" className={btnCbx}>
              + Cliente manual
            </Link>
          </div>
        )}
      </div>

      <ComercialList clients={clients} />
    </div>
  )
}

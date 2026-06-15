import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cbxMe, hasPerm } from '../../_lib'
import { CbxCard, CbxFlash, btnCbx, inputCbx } from '../../_ui'
import { SubmitButton } from '@/components/pending'
import { addBusinessType, removeBusinessType } from './actions'

type BizType = { id: string; name: string; is_active: boolean }

const FLASH: Record<string, { ok?: string; err?: string }> = {
  add: { ok: 'Tipo de negócio adicionado.' },
  del: { ok: 'Tipo de negócio removido.' },
  forbidden: { err: 'Sem permissão (Comercial ou Admin).' },
  empty: { err: 'Informe o nome.' },
  erro: { err: 'Não deu certo.' },
}

export default async function TiposNegocioPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const me = await cbxMe()
  if (!me.is_staff || !(hasPerm(me, 'COMERCIAL') || hasPerm(me, 'ADMIN'))) notFound()
  const { ok, err } = await searchParams
  const flash = FLASH[ok ?? err ?? ''] ?? {}

  const supabase = await createClient()
  const sb = supabase as unknown as { rpc: (n: string, a?: Record<string, unknown>) => Promise<{ data: BizType[] | null }> }
  const { data } = await sb.rpc('cbx_list_business_types', { p_all: true })
  const types = data ?? []

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/cbx/comercial" className="text-sm text-slate-500 hover:text-white">← Comercial</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Tipos de negócio</h1>
        <p className="mt-1 text-sm text-slate-400">
          Usados na ficha dos clientes e nos indicadores de perfil do CEO.
        </p>
      </div>

      <CbxFlash {...flash} />

      <CbxCard title="Adicionar">
        <form action={addBusinessType} className="flex gap-2">
          <input name="name" required placeholder="Ex.: Franquias" className={inputCbx} />
          <SubmitButton className={`${btnCbx} shrink-0`}>Adicionar</SubmitButton>
        </form>
      </CbxCard>

      <CbxCard title={`Cadastrados (${types.length})`}>
        <ul className="grid gap-2 sm:grid-cols-2">
          {types.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-3 py-2 text-sm">
              <span className="text-slate-200">{t.name}</span>
              <form action={removeBusinessType}>
                <input type="hidden" name="id" value={t.id} />
                <button className="text-xs text-rose-300 underline-offset-2 transition hover:underline">remover</button>
              </form>
            </li>
          ))}
        </ul>
      </CbxCard>
    </div>
  )
}

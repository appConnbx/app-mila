import { createClient } from '@/lib/supabase/server'

type Instance = {
  holding_id: string
  holding_name: string
  kind: 'corporate' | 'family'
  person_id: string
  role_title: string | null
}

const KIND = {
  corporate: { label: 'Empresa', cls: 'bg-brand/15 text-brand' },
  family: { label: 'Família', cls: 'bg-emerald-500/15 text-emerald-400' },
} as const

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('my_instances')
  const instances = (data ?? []) as unknown as Instance[]

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Minhas instâncias</h1>
      <p className="mt-1 text-sm text-slate-400">
        Escolha onde quer trabalhar. Você pode pertencer a várias empresas e famílias.
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Erro ao carregar instâncias: {error.message}
        </div>
      )}

      {!error && instances.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-surface-border bg-surface-card p-10 text-center">
          <p className="text-slate-300">
            Você ainda não está vinculado a nenhuma instância.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Peça a um administrador para te adicionar, ou contrate um plano.
          </p>
        </div>
      )}

      {instances.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((it) => {
            const kind = KIND[it.kind] ?? KIND.corporate
            return (
              <li
                key={it.holding_id}
                className="group cursor-pointer rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card transition hover:border-brand/60 hover:bg-slate-800/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-lg font-bold text-brand">
                    {it.holding_name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${kind.cls}`}>
                    {kind.label}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {it.holding_name}
                </h3>
                <p className="mt-0.5 text-sm text-slate-400">
                  {it.role_title ?? 'Membro'}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition group-hover:opacity-100">
                  Entrar
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

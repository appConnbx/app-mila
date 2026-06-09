import { createClient } from '@/lib/supabase/server'

type Instance = {
  holding_id: string
  holding_name: string
  kind: 'corporate' | 'family'
  person_id: string
  role_title: string | null
}

const KIND_LABEL: Record<string, string> = {
  corporate: 'Empresa',
  family: 'Família',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('my_instances')
  const instances = (data ?? []) as unknown as Instance[]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Minhas instâncias</h1>
      <p className="mt-1 text-sm text-slate-500">
        Escolha onde quer trabalhar. Você pode pertencer a várias empresas e famílias.
      </p>

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar instâncias: {error.message}
        </div>
      )}

      {!error && instances.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">
            Você ainda não está vinculado a nenhuma instância.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Peça a um administrador para te adicionar, ou contrate um plano.
          </p>
        </div>
      )}

      {instances.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {instances.map((it) => (
            <li
              key={it.holding_id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-900">
                  {it.holding_name}
                </span>
                <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand-dark">
                  {KIND_LABEL[it.kind] ?? it.kind}
                </span>
              </div>
              {it.role_title && (
                <p className="mt-1 text-sm text-slate-500">{it.role_title}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

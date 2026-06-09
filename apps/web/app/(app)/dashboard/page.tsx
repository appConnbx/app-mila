import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { enterInstance } from './actions'

type Instance = {
  holding_id: string
  holding_name: string
  kind: 'corporate' | 'family'
  person_id: string
  role_title: string | null
}

const KIND_CLS = {
  corporate: 'bg-brand/15 text-brand',
  family: 'bg-emerald-500/15 text-emerald-400',
} as const

export default async function DashboardPage() {
  const t = await getTranslations('instances')
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('my_instances')
  const instances = (data ?? []) as unknown as Instance[]

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('subtitle')}</p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {t('loadError', { message: error.message })}
        </div>
      )}

      {!error && instances.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-surface-border bg-surface-card p-10 text-center">
          <p className="text-slate-300">{t('emptyTitle')}</p>
          <p className="mt-1 text-sm text-slate-500">{t('emptyHint')}</p>
        </div>
      )}

      {instances.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((it) => {
            const kindCls = KIND_CLS[it.kind] ?? KIND_CLS.corporate
            const kindLabel = it.kind === 'family' ? t('family') : t('corporate')
            return (
              <li key={it.holding_id}>
                <form action={enterInstance}>
                  <input type="hidden" name="holding_id" value={it.holding_id} />
                  <button
                    type="submit"
                    className="group w-full rounded-2xl border border-surface-border bg-surface-card p-5 text-left shadow-card transition hover:border-brand/60 hover:bg-slate-800/40"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-lg font-bold text-brand">
                        {it.holding_name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${kindCls}`}>
                        {kindLabel}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {it.holding_name}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-400">
                      {it.role_title ?? t('member')}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition group-hover:opacity-100">
                      {t('enter')}
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </div>
                  </button>
                </form>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

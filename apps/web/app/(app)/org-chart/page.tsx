import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { OrgChart, type ChartData } from './_orgchart'

export default async function OrganogramaPage() {
  const t = await getTranslations('orgchart')
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const { data: hk } = await supabase.from('holdings').select('kind').eq('id', holdingId).single()
  if ((hk as unknown as { kind: string } | null)?.kind === 'family') redirect('/tasks')

  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: unknown }> }
  const { data } = await sb.rpc('org_chart')
  const chart = (data ?? { orgs: [] }) as ChartData

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">{t('title')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('subtitle')}</p>
      <div className="mt-6">
        <OrgChart data={chart} />
      </div>
    </div>
  )
}

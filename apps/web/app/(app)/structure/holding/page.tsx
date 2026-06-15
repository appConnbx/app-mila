import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { updateHolding } from '../actions'
import { Breadcrumb, Card, inputCls, btnCls } from '../_components'
import { LogoUploader } from '../_logo-uploader'
import { SubmitButton } from '@/components/pending'
import { TIMEZONES } from '@/lib/datetime'
import { HoldingTabs } from './_tabs'
import { ClientSupport, type ClientTicket } from './_support'

type Holding = {
  id: string
  name: string
  kind: string
  legal_name: string | null
  tax_id: string | null
  contact_email: string | null
  phone: string | null
  timezone: string | null
  language: string | null
  logo_url: string | null
}

type License = {
  plan_name: string | null
  seat_limit: number | null
  used: number | null
  available: number | null
  is_unlimited: boolean
  status: string | null
}

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
]

const labelCls = 'block text-sm font-medium text-slate-300'

export default async function HoldingPage({ searchParams }: { searchParams: Promise<{ tab?: string; support?: string; cfg?: string }> }) {
  const t = await getTranslations('structure')
  const { tab, support, cfg } = await searchParams
  const cookieStore = await cookies()
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const { data } = await supabase
    .from('holdings')
    .select('id, name, kind, legal_name, tax_id, contact_email, phone, timezone, language, logo_url')
    .eq('id', holdingId)
    .single()
  const h = data as unknown as Holding | null
  if (!h) redirect('/structure')

  const sb = supabase as unknown as { rpc: (n: string) => Promise<{ data: unknown }> }
  const [{ data: licRows }, { data: ticketRows }] = await Promise.all([
    sb.rpc('holding_license') as Promise<{ data: License[] | null }>,
    sb.rpc('client_list_tickets') as Promise<{ data: ClientTicket[] | null }>,
  ])
  const lic = (licRows ?? [])[0] ?? null
  const tickets = (ticketRows ?? []) as ClientTicket[]
  const unread = tickets.filter((tk) => tk.unread).length
  const manualSeg = h.kind === 'family' ? 'familia' : 'empresa'

  const config = (
    <div className="space-y-6">
      {cfg === 'ok' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{t('saved')}</div>
      )}
      {cfg === 'erro' && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{t('saveError')}</div>
      )}
      {/* Licenciamento */}
      <Card title={t('licenseTitle')}>
        {lic && lic.plan_name ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{t('licensePlan')}</p>
              <p className="mt-1 text-lg font-bold text-white">{lic.plan_name}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{t('licenseLimit')}</p>
              <p className="mt-1 text-lg font-bold text-white">{lic.is_unlimited ? t('licenseUnlimited') : lic.seat_limit}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{t('licenseUsed')}</p>
              <p className="mt-1 text-lg font-bold text-white">{lic.used ?? 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{t('licenseAvailable')}</p>
              <p className="mt-1 text-lg font-bold text-emerald-300">{lic.is_unlimited ? '∞' : (lic.available ?? 0)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t('licenseNone')}</p>
        )}
      </Card>

      {/* Logo / foto da holding */}
      <LogoUploader kind="holding" id={h.id} name={h.name} initialUrl={h.logo_url} />

      {/* Dados da holding */}
      <form action={updateHolding}>
        <Card title={t('holdingData')}>
          <div>
            <label htmlFor="name" className={labelCls}>{t('hName')}</label>
            <input id="name" name="name" required defaultValue={h.name} className={`mt-1 ${inputCls}`} />
          </div>
          <div>
            <label htmlFor="legal_name" className={labelCls}>{t('legalName')}</label>
            <input id="legal_name" name="legal_name" defaultValue={h.legal_name ?? ''} className={`mt-1 ${inputCls}`} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tax_id" className={labelCls}>{t('taxId')}</label>
              <input id="tax_id" name="tax_id" defaultValue={h.tax_id ?? ''} className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <label htmlFor="phone" className={labelCls}>{t('phoneField')}</label>
              <input id="phone" name="phone" defaultValue={h.phone ?? ''} className={`mt-1 ${inputCls}`} />
            </div>
          </div>
          <div>
            <label htmlFor="contact_email" className={labelCls}>{t('contactEmail')}</label>
            <input id="contact_email" name="contact_email" type="email" defaultValue={h.contact_email ?? ''} className={`mt-1 ${inputCls}`} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="timezone" className={labelCls}>{t('timezone')}</label>
              <select key={h.timezone ?? 'tz'} id="timezone" name="timezone" defaultValue={h.timezone ?? 'America/Sao_Paulo'} className={`mt-1 ${inputCls}`}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">{t('timezoneHint')}</p>
            </div>
            <div>
              <label htmlFor="language" className={labelCls}>{t('language')}</label>
              <select key={h.language ?? 'lang'} id="language" name="language" defaultValue={h.language ?? 'pt-BR'} className={`mt-1 ${inputCls}`}>
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500">{t('languageHint')}</p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <SubmitButton className={btnCls}>{t('save')}</SubmitButton>
          </div>
        </Card>
      </form>
    </div>
  )

  const supportNode = (
    <ClientSupport tickets={tickets} manualHref={`/manual/${manualSeg}`} flash={support === 'ok' ? 'ok' : support ? 'err' : undefined} />
  )

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumb items={[{ href: '/structure', label: t('title') }, { label: t('holdingMgmt') }]} />
      <h1 className="mt-3 text-2xl font-bold text-white">{t('holdingMgmt')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('holdingMgmtDesc')}</p>

      <HoldingTabs
        config={config}
        support={supportNode}
        initialTab={tab === 'support' || support ? 'support' : 'config'}
        unread={unread}
      />
    </div>
  )
}

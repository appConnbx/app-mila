import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { updateHolding, openSupportTicket } from '../actions'
import { Breadcrumb, Card, inputCls, btnCls } from '../_components'
import { LogoUploader } from '../_logo-uploader'
import { SubmitButton } from '@/components/pending'
import { Badge } from '@/components/ui'
import { TIMEZONES, fmtDayMonth } from '@/lib/datetime'

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

type Ticket = { id: string; title: string; type: string; status: string; created_at: string; resolved_at: string | null }

export default async function HoldingPage({ searchParams }: { searchParams: Promise<{ onboarding?: string; support?: string }> }) {
  const t = await getTranslations('structure')
  const locale = await getLocale()
  const { onboarding, support } = await searchParams
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
  const [{ data: licRows }, { data: adminFlag }, { data: ticketRows }] = await Promise.all([
    sb.rpc('holding_license') as Promise<{ data: License[] | null }>,
    sb.rpc('is_holding_admin') as Promise<{ data: boolean | null }>,
    sb.rpc('client_my_tickets') as Promise<{ data: Ticket[] | null }>,
  ])
  const lic = (licRows ?? [])[0] ?? null
  const isAdmin = !!adminFlag
  const tickets = (ticketRows ?? []) as Ticket[]
  const manualSeg = h.kind === 'family' ? 'familia' : 'empresa'
  const ticketStatus: Record<string, 'info' | 'warning' | 'success'> = { aberto: 'info', em_atendimento: 'warning', resolvido: 'success' }

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumb items={[{ href: '/structure', label: t('title') }, { label: t('holdingMgmt') }]} />
      <h1 className="mt-3 text-2xl font-bold text-white">{t('holdingMgmt')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('holdingMgmtDesc')}</p>

      {onboarding === '1' && (
        <div className="mt-4 glass glow-top p-5">
          <p className="text-base font-semibold text-white">{t('onboardingTitle')}</p>
          <p className="mt-1 text-sm text-slate-300">{t('onboardingDesc')}</p>
        </div>
      )}

      {/* Licenciamento da conta */}
      <div className="mt-6">
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
      </div>

      {/* Manual de configuração */}
      <div className="mt-6">
        <Card title={t('manualTitle')}>
          <p className="text-sm text-slate-400">{t('manualDesc')}</p>
          <Link
            href={`/manual/${manualSeg}`}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
              <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5M4 16h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('manualDownload')}
          </Link>
        </Card>
      </div>

      {/* Suporte — abertura de ticket (somente admin da holding) */}
      {isAdmin && (
        <div className="mt-6">
          <Card title={t('supportTitle')}>
            <p className="text-sm text-slate-400">{t('supportDesc')}</p>
            {support === 'ok' && (
              <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{t('supportOk')}</p>
            )}
            {support && support !== 'ok' && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{t('supportErr')}</p>
            )}
            <form action={openSupportTicket} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className={labelCls}>{t('supportSubject')}</label>
                  <input name="title" required maxLength={120} placeholder={t('supportSubjectPh')} className={`mt-1 ${inputCls}`} />
                </div>
                <div>
                  <label className={labelCls}>{t('supportType')}</label>
                  <select name="type" defaultValue="solicitacao" className={`mt-1 ${inputCls}`}>
                    <option value="solicitacao">{t('supportTypeRequest')}</option>
                    <option value="incidente">{t('supportTypeIncident')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('supportMessage')}</label>
                <textarea name="description" rows={3} placeholder={t('supportMessagePh')} className={`mt-1 ${inputCls}`} />
              </div>
              <div className="flex justify-end">
                <SubmitButton className={btnCls}>{t('supportSend')}</SubmitButton>
              </div>
            </form>

            {tickets.length > 0 && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="mb-2 text-sm font-semibold text-slate-200">{t('supportOpenList')}</p>
                <ul className="space-y-1.5">
                  {tickets.map((tk) => (
                    <li key={tk.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/40 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{tk.title}</span>
                      <span className="shrink-0 text-xs text-slate-500">{fmtDayMonth(tk.created_at, locale, h.timezone ?? 'America/Sao_Paulo')}</span>
                      <Badge variant={ticketStatus[tk.status] ?? 'info'} className="shrink-0">{t(`ticketStatus.${tk.status}`)}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      )}

      <div className="mt-6">
        <LogoUploader kind="holding" id={h.id} name={h.name} initialUrl={h.logo_url} />
      </div>

      <form action={updateHolding} className="mt-5">
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
            {/* key força a remontagem após salvar: select não-controlado
                manteria o valor antigo no DOM mesmo com a página revalidada. */}
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
}

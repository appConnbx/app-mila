import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { updateHolding } from '../actions'
import { Breadcrumb, Card, inputCls, btnCls } from '../_components'
import { LogoUploader } from '../_logo-uploader'
import { SubmitButton } from '@/components/pending'
import { TIMEZONES } from '@/lib/datetime'

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

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
]

const labelCls = 'block text-sm font-medium text-slate-300'

export default async function HoldingPage({ searchParams }: { searchParams: Promise<{ onboarding?: string }> }) {
  const t = await getTranslations('structure')
  const { onboarding } = await searchParams
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
  if (!h) redirect('/estrutura')

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumb items={[{ href: '/estrutura', label: t('title') }, { label: t('holdingMgmt') }]} />
      <h1 className="mt-3 text-2xl font-bold text-white">{t('holdingMgmt')}</h1>
      <p className="mt-1 text-sm text-slate-400">{t('holdingMgmtDesc')}</p>

      {onboarding === '1' && (
        <div className="mt-4 glass glow-top p-5">
          <p className="text-base font-semibold text-white">{t('onboardingTitle')}</p>
          <p className="mt-1 text-sm text-slate-300">{t('onboardingDesc')}</p>
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

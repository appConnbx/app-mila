import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient, ACTIVE_HOLDING_COOKIE } from '@/lib/supabase/server'
import { SubmitButton } from '@/components/pending'
import { finishOnboarding } from './actions'

export const metadata = { title: 'Onboarding · MILA' }

type Holding = { name: string; kind: 'corporate' | 'family' }

// Ícone de etapa: concluída (check), atual (ponto pulsante) ou pendente.
function StepDot({ state }: { state: 'done' | 'current' | 'next' }) {
  if (state === 'done') {
    return (
      <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
          <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/20 ring-1 ring-brand/50">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" />
      </span>
    )
  }
  return <span className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-slate-500 ring-1 ring-white/10">•</span>
}

export default async function OnboardingPage() {
  const t = await getTranslations('onboarding')
  const holdingId = (await cookies()).get(ACTIVE_HOLDING_COOKIE)?.value
  if (!holdingId) redirect('/dashboard')

  const supabase = await createClient()
  const { data } = await supabase.from('holdings').select('name, kind').eq('id', holdingId).single()
  const h = data as unknown as Holding | null
  if (!h) redirect('/dashboard')

  const isFamily = h.kind === 'family'
  const seg = isFamily ? 'familia' : 'empresa'
  const configBullets = (isFamily ? t.raw('configFamily') : t.raw('configCorp')) as string[]
  const configHint = isFamily ? t('configHintFamily') : t('configHintCorp')

  return (
    <div className={`mx-auto max-w-2xl ${isFamily ? 'theme-family' : ''}`}>
      <p className="text-sm font-semibold uppercase tracking-wider text-brand">MILA</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">{t('welcome', { name: h.name })}</h1>
      <p className="mt-1 text-slate-400">{t('subtitle')}</p>

      <div className="relative mt-8 space-y-6 pl-2">
        {/* Trilha vertical: linha conectora */}
        <span className="absolute left-[1.05rem] top-2 bottom-2 w-px bg-white/10" aria-hidden />

        {/* 1) Compra */}
        <div className="relative flex gap-4">
          <StepDot state="done" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white">{t('buyTitle')}</h2>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">{t('done')}</span>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">{t('buyDesc')}</p>
          </div>
        </div>

        {/* 2) Primeiro acesso */}
        <div className="relative flex gap-4">
          <StepDot state="done" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white">{t('accessTitle')}</h2>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">{t('done')}</span>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">{t('accessDesc')}</p>
          </div>
        </div>

        {/* 3) Configuração (atual) */}
        <div className="relative flex gap-4">
          <StepDot state="current" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white">{t('configTitle')}</h2>
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-medium text-brand">{t('now')}</span>
            </div>
            <div className="glass mt-3 p-5">
              <p className="text-sm text-slate-300">{configHint}</p>
              <ol className="mt-3 space-y-2">
                {configBullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-200">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand/15 text-[11px] font-bold text-brand">{i + 1}</span>
                    {b}
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/structure" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
                  {t('goConfig')}
                </Link>
                <Link href={`/manual/${seg}`} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
                  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
                    <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5M4 16h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t('manualCta')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé: concluir / pular (ambos liberam o app) */}
      <form action={finishOnboarding} className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-5">
        <SubmitButton className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
          {t('finish')}
        </SubmitButton>
        <SubmitButton className="text-sm text-slate-400 transition hover:text-white">{t('skip')}</SubmitButton>
      </form>
    </div>
  )
}

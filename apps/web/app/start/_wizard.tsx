'use client'

import { useState } from 'react'
import Link from 'next/link'

type Plan = { name: string; users: string; href: string; priceMain: string; priceUnit: string; priceSub: string }
type Plans = {
  starter: Plan; growth: Plan; scale: Plan; enterprise: Plan; family: Plan; familyplus: Plan
}
type Dict = Record<string, string>
type Step = 'audience' | 'bizSize' | 'bizPerk' | 'famSize' | 'reflect' | 'doubt' | 'result'
type PlanId = keyof Plans | 'free'

function Opt({ title, sub, badge, onClick }: { title: string; sub?: string; badge?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between gap-4 rounded-2xl border p-5 text-left transition ${
        badge
          ? 'border-brand/50 bg-brand/[0.06] ring-1 ring-brand/30 hover:bg-brand/[0.1]'
          : 'border-white/10 bg-white/[0.03] hover:border-brand/50 hover:bg-white/[0.06]'
      }`}
    >
      <span>
        {badge && (
          <span className="mb-1.5 inline-block rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-slate-950">⭐ {badge}</span>
        )}
        <span className="block text-base font-semibold text-white">{title}</span>
        {sub && <span className="mt-0.5 block text-sm text-slate-400">{sub}</span>}
      </span>
      <span className="shrink-0 text-lg text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-brand">→</span>
    </button>
  )
}

export function StartWizard({ dict, plans, freeHref }: { dict: Dict; plans: Plans; freeHref: string }) {
  const [step, setStep] = useState<Step>('audience')
  const [history, setHistory] = useState<Step[]>([])
  const [audience, setAudience] = useState<'business' | 'personal' | null>(null)
  const [planId, setPlanId] = useState<PlanId | null>(null)
  const [reflected, setReflected] = useState(false)

  const go = (next: Step) => { setHistory((h) => [...h, step]); setStep(next) }
  const back = () => {
    setReflected(false)
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setStep(prev)
      return h.slice(0, -1)
    })
  }

  const title =
    step === 'audience' ? dict.q1Title
    : step === 'bizSize' ? dict.bizSizeTitle
    : step === 'bizPerk' ? dict.bizPerkTitle
    : step === 'famSize' ? dict.famSizeTitle
    : step === 'reflect' ? dict.reflectTitle
    : step === 'doubt' ? dict.doubtTitle
    : dict.resultTitle

  return (
    <div className="w-full max-w-lg">
      {history.length > 0 && step !== 'result' && (
        <button onClick={back} className="mb-4 text-sm text-slate-500 transition hover:text-white">← {dict.back}</button>
      )}

      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>

      {/* Q1 — público */}
      {step === 'audience' && (
        <div className="mt-6 space-y-3">
          <Opt title={dict.q1Business} sub={dict.q1BusinessSub} onClick={() => { setAudience('business'); go('bizSize') }} />
          <Opt title={dict.q1Personal} sub={dict.q1PersonalSub} onClick={() => { setAudience('personal'); go('famSize') }} />
        </div>
      )}

      {/* Empresa — tamanho */}
      {step === 'bizSize' && (
        <div className="mt-6 space-y-3">
          <Opt title={dict.bizUpTo20} onClick={() => { setPlanId('starter'); go('bizPerk') }} />
          <Opt title={dict.bizUpTo50} onClick={() => { setPlanId('growth'); go('bizPerk') }} />
          <Opt title={dict.bizUpTo200} badge={dict.mostChosen} onClick={() => { setPlanId('scale'); go('bizPerk') }} />
          <Opt title={dict.bizUnlimited} onClick={() => { setPlanId('enterprise'); go('bizPerk') }} />
        </div>
      )}

      {/* Empresa — bônus Family Plus */}
      {step === 'bizPerk' && (
        <div className="mt-5 rounded-2xl border border-brand/30 bg-brand/[0.06] p-6">
          <div className="text-3xl">🎁</div>
          <p className="mt-3 text-slate-200">{dict.bizPerkDesc}</p>
          <button
            onClick={() => go('reflect')}
            className="mt-5 w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
          >
            {dict.bizPerkCta}
          </button>
        </div>
      )}

      {/* Família — tamanho */}
      {step === 'famSize' && (
        <div className="mt-6 space-y-3">
          <Opt title={dict.famUpTo5} onClick={() => { setPlanId('family'); go('reflect') }} />
          <Opt title={dict.famUpTo10} badge={dict.mostChosen} onClick={() => { setPlanId('familyplus'); go('reflect') }} />
          <Opt title={dict.famMore} onClick={() => { setPlanId('familyplus'); go('reflect') }} />
          <Opt title={dict.famJustMe} onClick={() => { setPlanId('free'); go('result') }} />
        </div>
      )}

      {/* Reflexão — qualquer resposta leva a um reforço positivo */}
      {step === 'reflect' && (
        <div className="mt-6 space-y-3">
          {!reflected ? (
            <>
              <Opt title={dict.reflectForget} onClick={() => setReflected(true)} />
              <Opt title={dict.reflectChase} onClick={() => setReflected(true)} />
              <Opt title={dict.reflectScatter} onClick={() => setReflected(true)} />
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-slate-200">{dict.reflectAck}</p>
              <button
                onClick={() => go('doubt')}
                className="mt-5 w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
              >
                {dict.continue}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dúvida — segurança do reembolso */}
      {step === 'doubt' && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-slate-300">{dict.doubtDesc}</p>
          <button
            onClick={() => go('result')}
            className="mt-5 w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
          >
            {dict.doubtCta}
          </button>
        </div>
      )}

      {/* Resultado */}
      {step === 'result' && planId === 'free' && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6 text-center">
          <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-0.5 text-[11px] font-semibold text-emerald-300">
            {dict.recommendedBadge}
          </span>
          <h2 className="mt-3 text-xl font-bold text-white">{dict.freeTitle}</h2>
          <p className="mt-2 text-sm text-slate-300">{dict.freeDesc}</p>
          <Link href={freeHref} className="mt-5 block rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">
            {dict.freeStart}
          </Link>
          <p className="mt-3 text-xs text-slate-500">{dict.freeUpsell}</p>
        </div>
      )}

      {step === 'result' && planId && planId !== 'free' && (
        <div className="mt-6 rounded-2xl border border-brand/40 bg-white/[0.03] p-6 text-center">
          <span className="inline-flex items-center rounded-full bg-brand/15 px-3 py-0.5 text-[11px] font-semibold text-brand">
            {dict.recommendedBadge}
          </span>
          <h2 className="mt-3 text-2xl font-bold text-white">{plans[planId].name}</h2>
          <p className="text-sm text-slate-400">{plans[planId].users}</p>
          <p className="mt-4 text-4xl font-extrabold text-white">
            {plans[planId].priceMain}
            <span className="text-base font-medium text-slate-400">{plans[planId].priceUnit}</span>
          </p>
          {plans[planId].priceSub && <p className="mt-1 text-xs text-slate-400">{plans[planId].priceSub}</p>}
          <a href={plans[planId].href} target="_blank" rel="noreferrer"
            className="mt-5 block rounded-xl bg-brand px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-brand-500">
            {dict.startCta}
          </a>
          <p className="mt-3 text-xs text-slate-500">{dict.refund}</p>
          {audience === 'business' && (
            <p className="mt-3 rounded-lg border border-brand/20 bg-brand/[0.06] px-3 py-2 text-xs text-brand">🎁 {dict.perkLine}</p>
          )}
        </div>
      )}
    </div>
  )
}

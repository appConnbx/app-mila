'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

/** Abas da Gestão da holding: Configurações e Suporte. */
export function HoldingTabs({
  config,
  support,
  initialTab = 'config',
  unread = 0,
}: {
  config: React.ReactNode
  support: React.ReactNode
  initialTab?: 'config' | 'support'
  unread?: number
}) {
  const t = useTranslations('structure')
  const [tab, setTab] = useState<'config' | 'support'>(initialTab)

  const tabBtn = (key: 'config' | 'support', label: string, badge?: number) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`relative rounded-lg px-4 py-1.5 text-sm font-medium transition ${
        tab === key ? 'bg-brand/15 text-brand' : 'text-slate-400 hover:text-white'
      }`}
    >
      {label}
      {!!badge && badge > 0 && (
        <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  )

  return (
    <div>
      <div className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {tabBtn('config', t('tabConfig'))}
        {tabBtn('support', t('tabSupport'), unread)}
      </div>
      <div className="mt-6">{tab === 'config' ? config : support}</div>
    </div>
  )
}

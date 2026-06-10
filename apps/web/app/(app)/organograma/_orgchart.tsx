'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type Team = { id: string; name: string; is_active: boolean; admins: string[]; members: string[] }
type Area = { id: string; name: string; is_active: boolean; admins: string[]; teams: Team[] }
type Org = { id: string; name: string; is_active: boolean; admins: string[]; areas: Area[] }
export type ChartData = { holding_name?: string; holding_admins?: string[]; orgs: Org[] }

type Selected = { type: string; name: string; admins: string[]; members?: string[] } | null

export function OrgChart({ data }: { data: ChartData }) {
  const t = useTranslations('orgchart')
  const [sel, setSel] = useState<Selected>(null)

  const node = (label: string, name: string, onClick: () => void, tone = 'brand') => (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-sm transition hover:border-brand/50 hover:bg-white/[0.08]"
    >
      <span className={`text-[10px] font-semibold uppercase tracking-wide ${tone === 'brand' ? 'text-brand' : 'text-slate-500'}`}>{label}</span>
      <span className="font-medium text-slate-100">{name}</span>
    </button>
  )

  return (
    <div>
      {/* Holding (topo) */}
      {data.holding_name && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setSel({ type: t('holdingLabel'), name: data.holding_name!, admins: data.holding_admins ?? [] })}
            className="glass glow-top rounded-xl px-5 py-3 text-center transition hover:border-brand/50"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">{t('holdingLabel')}</p>
            <p className="text-lg font-bold text-white">{data.holding_name}</p>
          </button>
        </div>
      )}

      {data.orgs.length === 0 && <div className="glass mt-6 p-10 text-center text-sm text-slate-500">{t('empty')}</div>}

      <div className="mt-6 space-y-4">
        {data.orgs.map((o) => (
          <div key={o.id} className="glass p-5">
            {/* Organização */}
            <div className="flex flex-wrap items-center gap-2">
              {node(t('orgLabel'), o.name, () => setSel({ type: t('orgLabel'), name: o.name, admins: o.admins }))}
              <span className="text-xs text-slate-500">{t('areasCount', { count: o.areas.length })}</span>
            </div>

            {/* Áreas */}
            <div className="mt-4 space-y-3 border-l border-white/10 pl-4">
              {o.areas.map((a) => (
                <div key={a.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    {node(t('areaLabel'), a.name, () => setSel({ type: t('areaLabel'), name: a.name, admins: a.admins }), 'muted')}
                  </div>
                  {/* Equipes */}
                  <div className="mt-2 flex flex-wrap gap-2 border-l border-white/5 pl-4">
                    {a.teams.map((tm) => (
                      <button
                        key={tm.id}
                        type="button"
                        onClick={() => setSel({ type: t('teamLabel'), name: tm.name, admins: tm.admins, members: tm.members })}
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-medium text-cyan-200 transition hover:bg-brand/20"
                      >
                        {tm.name}
                        <span className="text-cyan-300/60">· {tm.members.length}</span>
                      </button>
                    ))}
                    {a.teams.length === 0 && <span className="text-xs text-slate-600">{t('noTeams')}</span>}
                  </div>
                </div>
              ))}
              {o.areas.length === 0 && <span className="text-xs text-slate-600">{t('noAreas')}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSel(null)} />
          <div className="glass glow-top relative w-full max-w-md p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">{sel.type}</p>
                <h3 className="text-lg font-bold text-white">{sel.name}</h3>
              </div>
              <button onClick={() => setSel(null)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label={t('close')}>✕</button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('admins')}</p>
              {sel.admins.length ? (
                <ul className="mt-2 space-y-1">
                  {sel.admins.map((n) => <li key={n} className="text-sm text-slate-200">◆ {n}</li>)}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-slate-500">{t('noAdmins')}</p>
              )}
            </div>

            {sel.members !== undefined && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('members')}</p>
                {sel.members.length ? (
                  <ul className="mt-2 space-y-1">
                    {sel.members.map((n) => <li key={n} className="text-sm text-slate-200">• {n}</li>)}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">{t('noMembers')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

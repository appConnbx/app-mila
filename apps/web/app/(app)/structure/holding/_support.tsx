'use client'

import { useMemo, useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Badge, Button } from '@/components/ui'
import { SubmitButton } from '@/components/pending'
import { fmtDateTime } from '@/lib/datetime'
import { openSupportTicket, clientReplyTicket, clientCloseTicket, clientTicketThread } from '../actions'

export type ClientTicket = {
  id: string
  title: string
  status: 'aberto' | 'em_atendimento' | 'resolvido'
  created_at: string
  updated_at: string
  resolved_at: string | null
  unread: boolean
  last_msg_at: string | null
}
type Msg = { id: string; author: string; body: string; created_at: string; from_support: boolean }
type Thread = { ok: boolean; ticket?: { title: string; description: string | null; status: string }; messages?: Msg[] }

const STATUS_VARIANT = { aberto: 'info', em_atendimento: 'warning', resolvido: 'success' } as const
type SortKey = 'title' | 'updated' | 'status'

export function ClientSupport({
  tickets,
  manualHref,
  flash,
}: {
  tickets: ClientTicket[]
  manualHref: string
  flash?: 'ok' | 'err'
}) {
  const t = useTranslations('structure')
  const locale = useLocale()
  const [filter, setFilter] = useState<'open' | 'closed'>('open')
  const [sortKey, setSortKey] = useState<SortKey>('updated')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [modal, setModal] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [thread, setThread] = useState<Thread | null>(null)
  const [loading, startLoad] = useTransition()

  const fmt = (iso: string | null) => fmtDateTime(iso, locale)

  const rows = useMemo(() => {
    const base = tickets.filter((tk) => (filter === 'open' ? tk.status !== 'resolvido' : tk.status === 'resolvido'))
    const dir = sortDir === 'asc' ? 1 : -1
    return [...base].sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title) * dir
      if (sortKey === 'status') return a.status.localeCompare(b.status) * dir
      return (Date.parse(a.updated_at) - Date.parse(b.updated_at)) * dir
    })
  }, [tickets, filter, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir(k === 'title' ? 'asc' : 'desc') }
  }
  const arrow = (k: SortKey) => (sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')

  function openDetail(id: string) {
    setOpenId(id)
    setThread(null)
    startLoad(async () => { setThread(await clientTicketThread(id)) })
  }

  const openCount = tickets.filter((tk) => tk.status !== 'resolvido').length
  const closedCount = tickets.length - openCount

  return (
    <div className="space-y-4">
      {flash && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${flash === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>
          {flash === 'ok' ? t('supportOk') : t('supportErr')}
        </div>
      )}

      {/* Manual + novo chamado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={manualHref} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
            <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5M4 16h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('manualDownload')}
        </Link>
        <Button size="sm" onClick={() => setModal(true)}>+ {t('supportNew')}</Button>
      </div>

      {/* Filtros abertos/concluídos */}
      <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
        <button type="button" onClick={() => setFilter('open')} className={`rounded-md px-3 py-1 text-sm transition ${filter === 'open' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
          {t('supportTabOpen')} ({openCount})
        </button>
        <button type="button" onClick={() => setFilter('closed')} className={`rounded-md px-3 py-1 text-sm transition ${filter === 'closed' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
          {t('supportTabClosed')} ({closedCount})
        </button>
      </div>

      {/* Tabela */}
      <div className="glass overflow-x-auto p-0">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <button type="button" onClick={() => toggleSort('title')} className="uppercase tracking-wide transition hover:text-slate-200">{t('supportColSubject')}{arrow('title')}</button>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <button type="button" onClick={() => toggleSort('status')} className="uppercase tracking-wide transition hover:text-slate-200">{t('supportColStatus')}{arrow('status')}</button>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <button type="button" onClick={() => toggleSort('updated')} className="uppercase tracking-wide transition hover:text-slate-200">{t('supportColUpdated')}{arrow('updated')}</button>
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tk) => (
              <tr key={tk.id} className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.025]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {tk.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" title={t('supportUnread')} />}
                    <span className="font-medium text-slate-100">{tk.title}</span>
                  </div>
                  {tk.unread && <p className="mt-0.5 text-xs text-rose-300">{t('supportUnread')}</p>}
                </td>
                <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[tk.status]}>{t(`ticketStatus.${tk.status}`)}</Badge></td>
                <td className="px-4 py-3 text-slate-400">{fmt(tk.updated_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="secondary" onClick={() => openDetail(tk.id)}>{t('supportOpenBtn')}</Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">{t('supportEmpty')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: novo chamado (sem tipo) */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="glass glow-top relative w-full max-w-md p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-white">{t('supportNewTitle')}</h3>
              <button onClick={() => setModal(false)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label={t('close')}>✕</button>
            </div>
            <form action={openSupportTicket} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300">{t('supportSubject')}</label>
                <input name="title" required maxLength={120} placeholder={t('supportSubjectPh')} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-brand/60" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">{t('supportMessage')}</label>
                <textarea name="description" rows={4} placeholder={t('supportMessagePh')} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-brand/60" />
              </div>
              <div className="flex justify-end gap-2">
                <SubmitButton btnVariant="primary">{t('supportSend')}</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: detalhe + conversa + responder + fechar */}
      {openId && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setOpenId(null); setThread(null) }} />
          <div className="glass glow-top relative h-full w-full max-w-md overflow-y-auto p-6 sm:rounded-l-2xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-white">{thread?.ticket?.title ?? '…'}</h3>
              <button onClick={() => { setOpenId(null); setThread(null) }} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label={t('close')}>✕</button>
            </div>

            {loading && <p className="mt-6 text-sm text-slate-500">…</p>}

            {!loading && thread?.ok && (
              <>
                {thread.ticket?.status && (
                  <Badge variant={STATUS_VARIANT[(thread.ticket.status as ClientTicket['status'])] ?? 'info'} className="mt-2">
                    {t(`ticketStatus.${thread.ticket.status}`)}
                  </Badge>
                )}
                {thread.ticket?.description && (
                  <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{t('supportDescLabel')}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{thread.ticket.description}</p>
                  </div>
                )}

                {/* Conversa */}
                <div className="mt-4 space-y-3">
                  {(thread.messages ?? []).length === 0 && <p className="text-sm text-slate-500">{t('supportThreadEmpty')}</p>}
                  {(thread.messages ?? []).map((m) => (
                    <div key={m.id} className={`rounded-lg p-3 ${m.from_support ? 'bg-brand/10' : 'ml-6 bg-slate-900/50'}`}>
                      <p className="text-[11px] font-semibold text-slate-400">
                        {m.from_support ? t('supportFromSupport') : t('supportFromYou')} · {fmt(m.created_at)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-100">{m.body}</p>
                    </div>
                  ))}
                </div>

                {/* Responder + fechar (se não resolvido) */}
                {thread.ticket?.status !== 'resolvido' && (
                  <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                    <form action={clientReplyTicket} className="space-y-2" onSubmit={() => setTimeout(() => openDetail(openId), 400)}>
                      <input type="hidden" name="id" value={openId} />
                      <textarea name="body" rows={2} required placeholder={t('supportReplyPh')} className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-brand/60" />
                      <SubmitButton btnVariant="primary" btnSize="sm">{t('supportReply')}</SubmitButton>
                    </form>
                    <form action={clientCloseTicket} onSubmit={() => { setTimeout(() => { setOpenId(null); setThread(null) }, 400) }}>
                      <input type="hidden" name="id" value={openId} />
                      <SubmitButton btnVariant="ghost" btnSize="sm" className="w-full justify-start text-slate-400">✓ {t('supportCloseTicket')}</SubmitButton>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, Badge, Tag } from '@/components/ui'
import { useDialog } from '@/components/use-dialog'
import { advanceDemandStatus, toggleDemandPinned, getDemandThread, addObservationInline, type DemandThread } from '@/app/(app)/tasks/actions'

type Status = 'nova' | 'trabalhando' | 'finalizada'
const NEXT: Record<Status, Status> = { nova: 'trabalhando', trabalhando: 'finalizada', finalizada: 'nova' }
const VARIANT = { nova: 'info', trabalhando: 'warning', finalizada: 'success' } as const

export type CardDemand = {
  id: string
  title: string
  description: string | null
  status: Status
  pinned: boolean
  tags: string[]
  responsibleName: string
  eventName: string | null
}

export type DemandCardLabels = {
  status: Record<Status, string>
  pin: string
  createdWord: string
  dueWord: string
  autoTag: string
  overdueTag: string
  close: string
  openFull: string
  start: string // → trabalhando
  reopen: string // → nova
  finish: string // → finalizada
  observations: string
  history: string
  obsPlaceholder: string
  send: string
  noObs: string
  noHistory: string
  loading: string
}

/** Card interativo da lista ativa: clique abre modal de visualização; chip de
 *  status e botão de concluir (no card e no modal) avançam o status; ao
 *  finalizar, o card TREME e ESTOURA antes de migrar para Concluídas. */
export function DemandCard({
  demand,
  photoUrl,
  overdue,
  createdFmt,
  dueFmt,
  dueLabel,
  progress,
  labels: l,
}: {
  demand: CardDemand
  photoUrl: string | null
  overdue: boolean
  createdFmt: string
  dueFmt: string | null
  dueLabel: { text: string; cls: string }
  progress: { pct: number; color: string }
  labels: DemandCardLabels
}) {
  const [status, setStatus] = useState<Status>(demand.status)
  const [pinned, setPinned] = useState(demand.pinned)
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [busy, startTx] = useTransition()
  const [thread, setThread] = useState<DemandThread | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)
  const [obsText, setObsText] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const dialogRef = useDialog<HTMLDivElement>(open, () => setOpen(false))

  const loadThread = useCallback(async () => {
    setLoadingThread(true)
    try {
      setThread(await getDemandThread(demand.id))
    } finally {
      setLoadingThread(false)
    }
  }, [demand.id])

  useEffect(() => {
    if (!open) return
    if (thread === null) void loadThread()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, thread, loadThread])

  function sendObs() {
    const text = obsText.trim()
    if (!text || sending) return
    setSending(true)
    void (async () => {
      const res = await addObservationInline(demand.id, text)
      if (res.ok) {
        setObsText('')
        await loadThread()
      }
      setSending(false)
    })()
  }

  function burstAndRefresh() {
    const row = rootRef.current
    if (row) {
      row.style.maxHeight = `${row.offsetHeight}px`
      requestAnimationFrame(() => row.classList.add('demand-leaving'))
    }
    setLeaving(true)
    setTimeout(() => router.refresh(), 460)
  }

  function advance(to: Status) {
    if (busy || leaving) return
    const from = status
    setStatus(to)
    if (to === 'finalizada') {
      setOpen(false)
      startTx(async () => {
        await advanceDemandStatus(demand.id, from, 'finalizada')
        burstAndRefresh()
      })
    } else {
      startTx(async () => {
        await advanceDemandStatus(demand.id, from, to)
        router.refresh()
        if (open) void loadThread() // histórico atualiza no modal
      })
    }
  }

  function onPin(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    const next = !pinned
    setPinned(next)
    startTx(async () => {
      await toggleDemandPinned(demand.id, next)
      router.refresh()
    })
  }

  const tags = demand.tags ?? []

  return (
    <>
      <div
        ref={rootRef}
        data-demand-row=""
        onClick={() => setOpen(true)}
        className={`demand-row glass relative flex cursor-pointer gap-4 overflow-hidden p-5 pb-6 transition hover:border-brand/40 ${
          pinned ? '!border-orange-400/60 ring-1 ring-orange-400/40' : overdue ? '!border-rose-500/30' : ''
        }`}
      >
        <Avatar name={demand.responsibleName} src={photoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-100">{demand.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {demand.responsibleName} · {l.createdWord} {createdFmt}
                {demand.eventName && <span> · {demand.eventName}</span>}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <button
                type="button"
                onClick={onPin}
                disabled={busy}
                aria-pressed={pinned}
                title={l.pin}
                aria-label={l.pin}
                className={`transition disabled:opacity-50 ${pinned ? 'text-orange-400' : 'text-slate-500 hover:text-orange-300'}`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 4h6l-1 7 3 3v2H7v-2l3-3-1-7z" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  advance(NEXT[status])
                }}
                disabled={busy || leaving}
                title={`→ ${l.status[NEXT[status]]}`}
                aria-label={l.status[status]}
                className="cursor-pointer transition hover:opacity-80 disabled:opacity-60"
              >
                <Badge variant={VARIANT[status]}>{l.status[status]}</Badge>
              </button>
            </div>
          </div>
          {demand.description && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{demand.description}</p>}
          {(tags.length > 0 || overdue) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {overdue && <Tag tone="danger">#{l.overdueTag}</Tag>}
              {tags.map((tag) => (
                <Tag key={tag} tone={tag === 'prioridade-alta' ? 'danger' : 'brand'}>#{tag}</Tag>
              ))}
              {tags.length > 0 && <Tag tone="auto">⚙ {l.autoTag}</Tag>}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">{l.dueWord} {dueFmt ?? '—'}</span>
            <span className={`font-medium ${dueLabel.cls}`}>{dueLabel.text}</span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5">
          <div className={`h-full ${progress.color} transition-all`} style={{ width: `${progress.pct}%` }} />
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:place-items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demand-view-title"
            className={`glass glow-top my-auto max-h-[88vh] w-full max-w-lg overflow-y-auto p-6 outline-none ${pinned ? 'ring-1 ring-orange-400/40' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id="demand-view-title" className="text-lg font-bold text-white">{demand.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {demand.responsibleName} · {l.createdWord} {createdFmt}
                  {demand.eventName && <span> · {demand.eventName}</span>}
                </p>
              </div>
              <Badge variant={VARIANT[status]} className="shrink-0">{l.status[status]}</Badge>
            </div>

            {demand.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{demand.description}</p>}

            {(tags.length > 0 || overdue) && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {overdue && <Tag tone="danger">#{l.overdueTag}</Tag>}
                {tags.map((tag) => (
                  <Tag key={tag} tone={tag === 'prioridade-alta' ? 'danger' : 'brand'}>#{tag}</Tag>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">{l.dueWord} {dueFmt ?? '—'}</span>
              <span className={`font-medium ${dueLabel.cls}`}>{dueLabel.text}</span>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={onPin} disabled={busy} className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${pinned ? 'border-orange-400/50 bg-orange-400/10 text-orange-300' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}>
                  {l.pin}
                </button>
                {status === 'nova' && (
                  <button type="button" onClick={() => advance('trabalhando')} disabled={busy} className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20">
                    {l.start}
                  </button>
                )}
                {status === 'trabalhando' && (
                  <button type="button" onClick={() => advance('nova')} disabled={busy} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5">
                    {l.reopen}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/tasks/${demand.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5">
                  {l.openFull}
                </Link>
                <button type="button" onClick={() => advance('finalizada')} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60">
                  {l.finish}
                </button>
              </div>
            </div>

            {/* Observações */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-white">{l.observations}</h3>
              <div className="mt-2 flex gap-2">
                <textarea
                  value={obsText}
                  onChange={(e) => setObsText(e.target.value)}
                  rows={2}
                  placeholder={l.obsPlaceholder}
                  className="flex-1 rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
                />
                <button
                  type="button"
                  onClick={sendObs}
                  disabled={sending || !obsText.trim()}
                  className="self-end rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500 disabled:opacity-50"
                >
                  {l.send}
                </button>
              </div>
              <ul className="mt-3 space-y-2">
                {loadingThread && !thread && <li className="text-sm text-slate-500">{l.loading}</li>}
                {thread?.observations.map((o) => (
                  <li key={o.id} className="rounded-lg bg-slate-900/40 px-3 py-2">
                    <p className="whitespace-pre-wrap text-sm text-slate-200">{o.body}</p>
                    <p className="mt-1 text-xs text-slate-500">{o.author} · {o.when}</p>
                  </li>
                ))}
                {thread && thread.observations.length === 0 && <li className="text-sm text-slate-500">{l.noObs}</li>}
              </ul>
            </div>

            {/* Histórico */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold text-white">{l.history}</h3>
              <ul className="mt-2 space-y-2">
                {loadingThread && !thread && <li className="text-sm text-slate-500">{l.loading}</li>}
                {thread?.history.map((h) => (
                  <li key={h.id} className="text-xs">
                    <p className="text-slate-300">{h.text}</p>
                    <p className="text-slate-500">{h.who} · {h.when}</p>
                  </li>
                ))}
                {thread && thread.history.length === 0 && <li className="text-sm text-slate-500">{l.noHistory}</li>}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={l.close}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}

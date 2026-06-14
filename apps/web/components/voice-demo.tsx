'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Demo interativo do "segure-e-fale" do MILA. Tenta CAPTURA REAL de áudio
 * (microfone + transcrição via /api/demo/transcribe). Se o visitante negar o
 * microfone, não tiver suporte, ou a transcrição falhar, cai num exemplo
 * simulado — o demo nunca quebra. Máx. 5 itens; cada um alterna p/ "trabalhando".
 * Textos vêm por props (a landing/LPs não estão no provider de i18n do cliente).
 */
export type VoiceDemoLabels = {
  title: string
  subtitle: string
  holdHint: string
  recording: string
  transcribing: string
  formPlaceholder: string
  add: string
  listTitle: string
  empty: string
  statusNova: string
  statusTrabalhando: string
  statusFinalizada: string
  limit: string
  badge: string
  micPrompt: string
  micDenied: string
}

type Status = 'nova' | 'trabalhando' | 'finalizada'
type Item = { id: number; title: string; status: Status }
// Clique no status avança: nova → trabalhando → finalizada → nova (como no app).
const NEXT_STATUS: Record<Status, Status> = { nova: 'trabalhando', trabalhando: 'finalizada', finalizada: 'nova' }

const HOLD_MS = 10_000
const MAX = 5

export function VoiceDemo({ labels, samples }: { labels: VoiceDemoLabels; samples: string[] }) {
  const [items, setItems] = useState<Item[]>([])
  const [phase, setPhase] = useState<'idle' | 'recording' | 'transcribing'>('idle')
  const [progress, setProgress] = useState(0) // 0..1
  const [secs, setSecs] = useState(10)
  const [text, setText] = useState('')
  const startedAt = useRef(0)
  const tick = useRef<ReturnType<typeof setInterval> | null>(null)
  const cap = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sampleIdx = useRef(0)
  const nextId = useRef(1)
  const recRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const realRef = useRef(false)
  // Aviso de microfone: 'ask' na 1ª interação (pede autorização p/ experiência real),
  // 'denied' se negar/não suportar (o exemplo cai no genérico), 'none' quando concedido.
  const [micNote, setMicNote] = useState<'none' | 'ask' | 'denied'>('none')
  const askedRef = useRef(false)
  const full = items.length >= MAX

  function clearTimers() {
    if (tick.current) clearInterval(tick.current)
    if (cap.current) clearTimeout(cap.current)
    tick.current = null
    cap.current = null
  }
  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    recRef.current = null
  }
  useEffect(() => () => { clearTimers(); stopStream() }, [])

  function addItem(title: string) {
    const t = title.trim().slice(0, 120)
    if (!t) return
    setItems((cur) => (cur.length >= MAX ? cur : [...cur, { id: nextId.current++, title: t, status: 'nova' }]))
  }
  function addSample() {
    addItem(samples[sampleIdx.current % samples.length])
    sampleIdx.current += 1
  }

  function startTimers() {
    setProgress(0)
    setSecs(Math.round(HOLD_MS / 1000))
    startedAt.current = Date.now()
    tick.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current
      setProgress(Math.min(1, elapsed / HOLD_MS))
      setSecs(Math.max(0, Math.ceil((HOLD_MS - elapsed) / 1000)))
    }, 100)
    cap.current = setTimeout(() => void stopHold(), HOLD_MS)
  }

  async function startHold() {
    if (phase !== 'idle' || full) return
    setPhase('recording')
    realRef.current = false
    chunksRef.current = []
    // Na 1ª interação, orienta a autorizar o microfone (some quando concedido).
    if (!askedRef.current) { askedRef.current = true; setMicNote('ask') }
    startTimers()
    // Tenta o microfone real (assíncrono; a barra já está correndo).
    try {
      const md = navigator.mediaDevices
      if (!md?.getUserMedia || typeof MediaRecorder === 'undefined') { setMicNote('denied'); return }
      const stream = await md.getUserMedia({ audio: true })
      streamRef.current = stream
      // Se o usuário já soltou durante o prompt de permissão (timers limpos), encerra.
      if (!tick.current) { stream.getTracks().forEach((t) => t.stop()); return }
      const mime = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((m) => MediaRecorder.isTypeSupported?.(m))
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recRef.current = rec
      realRef.current = true
      setMicNote('none') // permissão concedida → experiência real
      rec.start()
    } catch {
      realRef.current = false // microfone negado/indisponível → caminho genérico
      setMicNote('denied')
    }
  }

  async function stopHold() {
    if (phase !== 'recording') return
    const elapsed = Date.now() - startedAt.current
    clearTimers()
    setProgress(0)

    const rec = recRef.current
    if (realRef.current && rec && rec.state === 'recording') {
      setPhase('transcribing')
      const blob = await new Promise<Blob>((resolve) => {
        rec.onstop = () => resolve(new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' }))
        rec.stop()
      })
      stopStream()
      if (elapsed < 500 || blob.size < 1200) { addSample(); setPhase('idle'); return }
      try {
        const fd = new FormData()
        fd.append('file', blob, 'audio.webm')
        const res = await fetch('/api/demo/transcribe', { method: 'POST', body: fd })
        if (!res.ok) throw new Error('stt')
        const { text: t } = (await res.json()) as { text?: string }
        if (t && t.trim()) addItem(t)
        else addSample()
      } catch {
        addSample()
      }
      setPhase('idle')
      return
    }

    // Microfone negado/indisponível → exemplo simulado (curto = ignora).
    stopStream()
    if (elapsed < 400) { setPhase('idle'); return }
    setPhase('transcribing')
    setTimeout(() => { addSample(); setPhase('idle') }, 500)
  }

  function cycleStatus(id: number) {
    setItems((cur) => cur.map((it) => (it.id === id ? { ...it, status: NEXT_STATUS[it.status] } : it)))
  }

  return (
    <div className="glass glow-top mx-auto grid max-w-4xl gap-6 p-6 sm:grid-cols-2 sm:p-8">
      {/* Captura: microfone + formulário */}
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">{labels.badge}</p>
        <h3 className="text-lg font-bold text-white">{labels.title}</h3>
        <p className="-mt-2 text-sm text-slate-400">{labels.subtitle}</p>

        <button
          type="button"
          aria-label={labels.holdHint}
          disabled={phase === 'transcribing' || full}
          onPointerDown={() => void startHold()}
          onPointerUp={() => void stopHold()}
          onPointerLeave={() => void stopHold()}
          onPointerCancel={() => void stopHold()}
          className={`grid h-24 w-24 place-items-center rounded-full border-2 transition ${
            phase === 'recording'
              ? 'scale-110 border-rose-400 bg-rose-500/20 text-rose-300'
              : 'border-brand/60 bg-brand/10 text-brand hover:bg-brand/20'
          } ${full ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" aria-hidden>
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div className="h-1.5 w-full max-w-[14rem] overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-500 transition-[width] duration-100" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <p className="h-4 text-xs text-slate-400">
          {phase === 'recording' ? `${labels.recording} · ${secs}s` : phase === 'transcribing' ? labels.transcribing : full ? labels.limit : labels.holdHint}
        </p>

        {micNote !== 'none' && (
          <p
            className={`flex items-start gap-1.5 rounded-lg px-3 py-2 text-left text-xs ${
              micNote === 'denied' ? 'bg-amber-500/10 text-amber-300' : 'bg-sky-500/10 text-sky-300'
            }`}
          >
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden className="mt-0.5 shrink-0">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 7.2v3.4M8 5.1h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            {micNote === 'denied' ? labels.micDenied : labels.micPrompt}
          </p>
        )}

        <form
          className="flex w-full max-w-[16rem] gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            addItem(text)
            setText('')
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={full}
            placeholder={labels.formPlaceholder}
            maxLength={80}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-brand/60"
          />
          <button type="submit" disabled={full || !text.trim()} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500 disabled:opacity-50">
            {labels.add}
          </button>
        </form>
      </div>

      {/* Lista de demandas geradas */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">{labels.listTitle}</p>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">{items.length}/{MAX}</span>
        </div>
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">{labels.empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => {
              const done = it.status === 'finalizada'
              const chipCls = done
                ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : it.status === 'trabalhando'
                  ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
              const chipLabel = done ? labels.statusFinalizada : it.status === 'trabalhando' ? labels.statusTrabalhando : labels.statusNova
              return (
                <li key={it.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/40 px-3 py-2">
                  <span className={`min-w-0 flex-1 truncate text-sm ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{it.title}</span>
                  <button
                    type="button"
                    onClick={() => cycleStatus(it.id)}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition ${chipCls}`}
                  >
                    {done && (
                      <svg viewBox="0 0 16 16" width="11" height="11" fill="none" aria-hidden>
                        <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {chipLabel}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

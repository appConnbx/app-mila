'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Demo interativo (sem backend) que simula o "segure-e-fale" do MILA: o visitante
 * segura o microfone (até 10s), solta e uma demanda de exemplo é criada na lista;
 * também dá para inserir por formulário. Máx. 5 itens; cada um alterna para
 * "trabalhando". Mostra a praticidade da ferramenta. Textos vêm por props porque
 * a landing/páginas de venda não estão dentro do provider de i18n do cliente.
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
  limit: string
  badge: string
}

type Item = { id: number; title: string; status: 'nova' | 'trabalhando' }

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
  const full = items.length >= MAX

  function clearTimers() {
    if (tick.current) clearInterval(tick.current)
    if (cap.current) clearTimeout(cap.current)
    tick.current = null
    cap.current = null
  }
  useEffect(() => clearTimers, [])

  function addItem(title: string) {
    const t = title.trim()
    if (!t) return
    setItems((cur) => (cur.length >= MAX ? cur : [...cur, { id: nextId.current++, title: t, status: 'nova' }]))
  }

  function startHold() {
    if (phase !== 'idle' || full) return
    setPhase('recording')
    setProgress(0)
    setSecs(Math.round(HOLD_MS / 1000))
    startedAt.current = Date.now()
    tick.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current
      setProgress(Math.min(1, elapsed / HOLD_MS))
      setSecs(Math.max(0, Math.ceil((HOLD_MS - elapsed) / 1000)))
    }, 100)
    cap.current = setTimeout(stopHold, HOLD_MS)
  }

  function stopHold() {
    if (phase !== 'recording') return
    const elapsed = Date.now() - startedAt.current
    clearTimers()
    setProgress(0)
    if (elapsed < 400) {
      // toque rápido demais: ignora (mesma regra do app real)
      setPhase('idle')
      return
    }
    setPhase('transcribing')
    // "transcrição" simulada: pega a próxima frase de exemplo
    setTimeout(() => {
      const phrase = samples[sampleIdx.current % samples.length]
      sampleIdx.current += 1
      addItem(phrase)
      setPhase('idle')
    }, 650)
  }

  function toggleStatus(id: number) {
    setItems((cur) =>
      cur.map((it) => (it.id === id ? { ...it, status: it.status === 'nova' ? 'trabalhando' : 'nova' } : it)),
    )
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
          onPointerDown={startHold}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
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
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/40 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{it.title}</span>
                <button
                  type="button"
                  onClick={() => toggleStatus(it.id)}
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold transition ${
                    it.status === 'trabalhando'
                      ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                      : 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                  }`}
                >
                  {it.status === 'trabalhando' ? labels.statusTrabalhando : labels.statusNova}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

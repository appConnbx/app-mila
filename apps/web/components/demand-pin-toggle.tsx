'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleDemandPinned } from '@/app/(app)/tasks/actions'

/** Botão de "pinar como prioritária" no card da lista. Vive dentro do <Link>,
 *  por isso previne navegação. Pinada = contorno alaranjado + topo da lista. */
export function DemandPinToggle({ demandId, pinned, label }: { demandId: string; pinned: boolean; label: string }) {
  const [on, setOn] = useState(pinned)
  const [busy, start] = useTransition()
  const router = useRouter()

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    const next = !on
    setOn(next)
    start(async () => {
      await toggleDemandPinned(demandId, next)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={on}
      title={label}
      aria-label={label}
      className={`shrink-0 transition disabled:opacity-50 ${on ? 'text-orange-400' : 'text-slate-500 hover:text-orange-300'}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 4h6l-1 7 3 3v2H7v-2l3-3-1-7z" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    </button>
  )
}

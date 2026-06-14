'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui'
import { advanceDemandStatus } from '@/app/(app)/tasks/actions'

type Status = 'nova' | 'trabalhando' | 'finalizada'
const NEXT: Record<Status, Status> = { nova: 'trabalhando', trabalhando: 'finalizada', finalizada: 'nova' }
const VARIANT = { nova: 'info', trabalhando: 'warning', finalizada: 'success' } as const

/**
 * Chip de status clicável na LISTA (evita abrir o detalhe — agilidade).
 * Clique avança: nova → trabalhando → finalizada. Ao finalizar, some com
 * fade/colapso e o servidor recarrega (a demanda migra para "Concluídas").
 */
export function DemandStatusToggle({
  demandId,
  initial,
  labels,
}: {
  demandId: string
  initial: Status
  labels: Record<Status, string>
}) {
  const [status, setStatus] = useState<Status>(initial)
  const [pending, start] = useTransition()
  const [leaving, setLeaving] = useState(false)
  const router = useRouter()

  function onClick(e: React.MouseEvent) {
    e.preventDefault() // não navega para o detalhe (o chip vive dentro do <Link>)
    e.stopPropagation()
    if (pending || leaving) return
    const next = NEXT[status]
    setStatus(next)

    if (next === 'finalizada') {
      // Efeito de "sumindo" antes de migrar para Concluídas.
      const row = (e.currentTarget as HTMLElement).closest('[data-demand-row]') as HTMLElement | null
      if (row) {
        row.style.maxHeight = `${row.offsetHeight}px`
        requestAnimationFrame(() => row.classList.add('demand-leaving'))
      }
      setLeaving(true)
      start(async () => {
        await advanceDemandStatus(demandId, next)
        setTimeout(() => router.refresh(), 360)
      })
      return
    }
    start(async () => {
      await advanceDemandStatus(demandId, next)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || leaving}
      title={labels[NEXT[status]] ? `→ ${labels[NEXT[status]]}` : undefined}
      className="shrink-0 cursor-pointer transition hover:opacity-80 disabled:opacity-60"
      aria-label={labels[status]}
    >
      <Badge variant={VARIANT[status]}>{labels[status]}</Badge>
    </button>
  )
}

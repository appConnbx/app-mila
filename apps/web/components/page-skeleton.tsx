/**
 * Placeholder de carregamento (skeleton) usado pelos loading.tsx das rotas, para
 * dar feedback imediato na navegação em vez de tela parada. O `animate-pulse` é
 * neutralizado automaticamente para quem usa "reduzir movimento" (globals.css).
 */
export function PageSkeleton({ rows = 4, kpis = true }: { rows?: number; kpis?: boolean }) {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-8 w-56 rounded-lg bg-white/10" />
      {kpis && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/5" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  )
}

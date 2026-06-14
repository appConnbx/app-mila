export type FamilyBonusLabels = {
  kicker: string
  title: string
  desc: string
  p1: string
  p2: string
  p3: string
}

/**
 * Callout de endomarketing: destaca o bônus Family Plus incluído na contratação
 * corporativa (empresa como fornecedora de benefícios, parceira do funcionário).
 * Presentacional/server — usa classes tematizadas (dark/light).
 */
export function FamilyBonusCallout({ labels }: { labels: FamilyBonusLabels }) {
  const points = [labels.p1, labels.p2, labels.p3]
  return (
    <div className="glass relative overflow-hidden p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-2xl">🎁</div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">{labels.kicker}</p>
          <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">{labels.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{labels.desc}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">
                <span className="mt-0.5 shrink-0 font-bold text-brand">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

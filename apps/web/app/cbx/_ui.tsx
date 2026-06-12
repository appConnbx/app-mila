/** Blocos visuais do portal CBX (pt-BR fixo: ferramenta interna da equipe). */

export const inputCbx =
  'w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400/60'
export const btnCbx =
  'inline-flex items-center justify-center rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60'
export const btnGhostCbx =
  'inline-flex items-center justify-center rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white'
export const labelCbx = 'block text-[11px] font-semibold uppercase tracking-wide text-slate-500'
export const thCbx = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500'
export const tdCbx = 'px-4 py-3'

export function CbxCard({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Kpi({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'ok' | 'warn' }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === 'ok' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

export function CbxFlash({ ok, err }: { ok?: string; err?: string }) {
  if (!ok && !err) return null
  return (
    <div
      className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
        ok
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
      }`}
    >
      {ok ?? err}
    </div>
  )
}

export function Pill({ children, tone }: { children: React.ReactNode; tone?: 'ok' | 'warn' | 'err' | 'info' }) {
  const cls =
    tone === 'ok' ? 'bg-emerald-500/15 text-emerald-300'
    : tone === 'warn' ? 'bg-amber-400/15 text-amber-300'
    : tone === 'err' ? 'bg-rose-500/15 text-rose-300'
    : tone === 'info' ? 'bg-sky-500/15 text-sky-300'
    : 'bg-white/10 text-slate-300'
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })
}

export function fmtMoney(cents: number | null | undefined, currency = 'BRL') {
  if (cents == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100)
}

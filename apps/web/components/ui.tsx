import Link from 'next/link'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

/** Junta classes ignorando valores falsy. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/* ---------------- Tokens de formulário ---------------- */
export const fieldClasses =
  'w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand focus:ring-1 focus:ring-brand'
export const labelClasses = 'block text-sm font-medium text-slate-300'

/* ---------------- Button ---------------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-slate-950 hover:bg-brand-500 font-semibold',
  secondary: 'border border-surface-border text-slate-200 hover:bg-slate-800 font-medium',
  ghost: 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium',
  danger: 'border border-red-500/30 text-red-300 hover:bg-red-500/10 font-medium',
}
const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}
const BTN_BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:opacity-50'

type ButtonProps = {
  href?: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ href, variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const classes = cn(BTN_BASE, VARIANTS[variant], SIZES[size], className)
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

/* ---------------- Card ---------------- */
export function Card({
  title,
  actions,
  className,
  glow,
  children,
}: {
  title?: string
  actions?: ReactNode
  className?: string
  glow?: boolean
  children: ReactNode
}) {
  return (
    <section className={cn('glass p-5', glow && 'glow-top', className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

/* ---------------- Aurora (cena de fundo) ---------------- */
export function Aurora() {
  return <div className="aurora" aria-hidden />
}

/* ---------------- Avatar (iniciais com gradiente determinístico) ---------------- */
const AV_GRADIENTS = [
  'from-sky-300 to-blue-500',
  'from-orange-300 to-orange-500',
  'from-indigo-300 to-indigo-500',
  'from-emerald-300 to-emerald-500',
  'from-fuchsia-300 to-fuchsia-500',
  'from-amber-300 to-amber-500',
  'from-cyan-300 to-cyan-500',
  'from-rose-300 to-rose-500',
]
export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
function gradientFor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AV_GRADIENTS[h % AV_GRADIENTS.length]
}
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-9 w-9 text-xs rounded-lg', md: 'h-11 w-11 text-sm rounded-xl', lg: 'h-12 w-12 text-base rounded-xl' }
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center bg-gradient-to-b font-bold text-slate-950',
        gradientFor(name),
        sizes[size],
      )}
    >
      {initials(name)}
    </span>
  )
}

/* ---------------- Tag (pílula de tag de demanda) ---------------- */
export function Tag({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'danger' | 'auto' }) {
  const tones = {
    brand: 'bg-brand/15 text-cyan-200',
    danger: 'bg-rose-500/15 text-rose-300',
    auto: 'bg-white/[0.06] text-slate-400',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-semibold', tones[tone])}>{children}</span>
}

/* ---------------- DeadlineBar (progresso do tempo até o prazo) ---------------- */
export function DeadlineBar({
  createdAt,
  dueDate,
  done,
}: {
  createdAt: string
  dueDate: string | null
  done?: boolean
}) {
  if (done) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: '100%' }} />
        </div>
      </div>
    )
  }
  if (!dueDate) {
    return (
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-brand/60" style={{ width: '6%' }} />
      </div>
    )
  }
  const start = new Date(createdAt).getTime()
  const end = new Date(dueDate + 'T23:59:59').getTime()
  const now = Date.now()
  const overdue = now > end
  const pct = overdue ? 100 : Math.max(4, Math.min(100, Math.round(((now - start) / Math.max(1, end - start)) * 100)))
  // < 70% = no prazo (verde) · 70–100% = próximo (âmbar) · estourou = vermelho
  const color = overdue ? 'bg-gradient-to-r from-rose-400 to-red-500' : pct >= 70 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ---------------- Badge ---------------- */
type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
const BADGE: Record<BadgeVariant, string> = {
  brand: 'bg-brand/15 text-brand',
  success: 'bg-emerald-500/15 text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-300',
  danger: 'bg-red-500/15 text-red-300',
  info: 'bg-blue-500/15 text-blue-300',
  neutral: 'bg-slate-600/30 text-slate-400',
}
export function Badge({ variant = 'neutral', className, children }: { variant?: BadgeVariant; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', BADGE[variant], className)}>
      {children}
    </span>
  )
}

/* ---------------- PageHeader ---------------- */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------------- EmptyState ---------------- */
export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 py-10 text-center text-sm text-slate-500', className)}>{children}</div>
}

/* ---------------- Field ---------------- */
export function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClasses}>
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

/* ---------------- ProgressBar ---------------- */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-slate-800', className)}>
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

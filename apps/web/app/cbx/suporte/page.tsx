import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cbxMe, hasPerm } from '../_lib'
import { CbxCard, CbxFlash, Pill, btnCbx, btnGhostCbx, inputCbx, labelCbx, thCbx, tdCbx, fmtDate } from '../_ui'
import { SubmitButton } from '@/components/pending'
import { createTicket } from './actions'

type Ticket = {
  id: string
  holding_id: string | null
  client_name: string
  title: string
  type: 'incidente' | 'solicitacao'
  status: 'aberto' | 'em_atendimento' | 'resolvido'
  assignee_name: string | null
  created_at: string
  resolved_at: string | null
  comment_count: number
}
type ClientOpt = { holding_id: string; name: string }
type StaffOpt = { id: string; full_name: string }

const FLASH: Record<string, { ok?: string; err?: string }> = {
  campos: { err: 'Escolha o cliente e dê um título ao ticket.' },
  erro: { err: 'Não deu certo. Tente novamente.' },
}

const STATUS_PILL: Record<Ticket['status'], { label: string; tone: 'err' | 'warn' | 'ok' }> = {
  aberto: { label: 'Aberto', tone: 'err' },
  em_atendimento: { label: 'Em atendimento', tone: 'warn' },
  resolvido: { label: 'Resolvido', tone: 'ok' },
}

export default async function CbxSuportePage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; view?: string }> }) {
  const me = await cbxMe()
  if (!me.is_staff || !hasPerm(me, 'SUPORTE')) notFound()
  const { ok, err, view } = await searchParams
  const flash = FLASH[ok ?? err ?? ''] ?? {}
  const tab: 'abertos' | 'concluidos' = view === 'concluidos' ? 'concluidos' : 'abertos'

  const supabase = await createClient()
  const sb = supabase as unknown as { rpc: (n: string, a?: Record<string, unknown>) => Promise<{ data: unknown }> }
  const [ticketsRes, clientsRes, staffRes] = await Promise.all([
    sb.rpc('cbx_list_tickets', { p_status: null }),
    sb.rpc('cbx_list_clients'),
    sb.rpc('cbx_staff_options'),
  ])
  const tickets = (ticketsRes.data as Ticket[] | null) ?? []
  const clients = ((clientsRes.data as ClientOpt[] | null) ?? []).map((c) => ({ holding_id: c.holding_id, name: c.name }))
  const staff = (staffRes.data as StaffOpt[] | null) ?? []

  const open = tickets.filter((t) => t.status !== 'resolvido')
  const resolved = tickets.filter((t) => t.status === 'resolvido')

  // Concluídos agrupados: pasta CLIENTE → subpasta ANO/MÊS (estilo demandas concluídas).
  const clientMap = new Map<string, Map<string, { label: string; sort: number; items: Ticket[] }>>()
  for (const t of resolved) {
    const dt = new Date(t.resolved_at ?? t.created_at)
    const y = dt.getFullYear()
    const m = dt.getMonth()
    const mk = `${y}-${String(m).padStart(2, '0')}`
    if (!clientMap.has(t.client_name)) clientMap.set(t.client_name, new Map())
    const months = clientMap.get(t.client_name)!
    if (!months.has(mk)) {
      const monthName = dt.toLocaleDateString('pt-BR', { month: 'long' })
      months.set(mk, { label: `${y} · ${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}`, sort: y * 100 + m, items: [] })
    }
    months.get(mk)!.items.push(t)
  }
  const clientGroups = Array.from(clientMap.entries())
    .map(([client, months]) => ({
      client,
      count: Array.from(months.values()).reduce((a, g) => a + g.items.length, 0),
      months: Array.from(months.values()).sort((a, b) => b.sort - a.sort),
    }))
    .sort((a, b) => a.client.localeCompare(b.client))

  const ticketRow = (t: Ticket) => {
    const st = STATUS_PILL[t.status]
    return (
      <tr key={t.id} className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]">
        <td className={tdCbx}>
          <Link href={`/cbx/suporte/${t.id}`} className="font-semibold text-slate-100 hover:text-amber-300">{t.title}</Link>
          {Number(t.comment_count) > 0 && <span className="ml-2 text-xs text-slate-500">💬 {t.comment_count}</span>}
        </td>
        <td className={`${tdCbx} text-slate-300`}>{t.client_name}</td>
        <td className={tdCbx}>
          <Pill tone={t.type === 'incidente' ? 'err' : 'info'}>{t.type === 'incidente' ? 'Incidente' : 'Solicitação'}</Pill>
        </td>
        <td className={`${tdCbx} text-slate-300`}>{t.assignee_name ?? '—'}</td>
        <td className={tdCbx}><Pill tone={st.tone}>{st.label}</Pill></td>
        <td className={`${tdCbx} text-slate-400`}>{fmtDate(tab === 'concluidos' ? (t.resolved_at ?? t.created_at) : t.created_at)}</td>
      </tr>
    )
  }

  const headRow = (
    <tr className="border-b border-white/10">
      <th className={thCbx}>Ticket</th>
      <th className={thCbx}>Cliente</th>
      <th className={thCbx}>Tipo</th>
      <th className={thCbx}>Responsável</th>
      <th className={thCbx}>Status</th>
      <th className={thCbx}>{tab === 'concluidos' ? 'Resolvido em' : 'Aberto em'}</th>
    </tr>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Suporte</h1>
          <p className="mt-1 text-sm text-slate-400">{open.length} ticket(s) em aberto · {resolved.length} concluído(s).</p>
        </div>
        <Link href="/cbx/suporte/acessos" className={btnGhostCbx}>Acessos temporários →</Link>
      </div>

      <CbxFlash {...flash} />

      {/* Novo ticket */}
      <CbxCard title="Abrir ticket">
        <form action={createTicket} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCbx}>Cliente</label>
            <select name="holding_id" required defaultValue="" className={`mt-1 ${inputCbx}`}>
              <option value="" disabled>Escolha o cliente</option>
              {clients.map((c) => (<option key={c.holding_id} value={c.holding_id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <label className={labelCbx}>Tipo</label>
            <select name="type" className={`mt-1 ${inputCbx}`} defaultValue="solicitacao">
              <option value="solicitacao">Solicitação</option>
              <option value="incidente">Incidente</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCbx}>Título</label>
            <input name="title" required className={`mt-1 ${inputCbx}`} placeholder="Resumo do atendimento" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCbx}>Descrição</label>
            <textarea name="description" rows={3} className={`mt-1 ${inputCbx}`} placeholder="Detalhes, contexto, passos…" />
          </div>
          <div>
            <label className={labelCbx}>Responsável</label>
            <select name="assignee" defaultValue="" className={`mt-1 ${inputCbx}`}>
              <option value="">— sem responsável —</option>
              {staff.map((s) => (<option key={s.id} value={s.id}>{s.full_name}</option>))}
            </select>
          </div>
          <div className="flex items-end">
            <SubmitButton className={btnCbx}>Abrir ticket</SubmitButton>
          </div>
        </form>
      </CbxCard>

      {/* Abas Abertos / Concluídos */}
      <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
        <Link href="/cbx/suporte" className={`rounded-md px-3 py-1 text-sm transition ${tab === 'abertos' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
          Abertos ({open.length})
        </Link>
        <Link href="/cbx/suporte?view=concluidos" className={`rounded-md px-3 py-1 text-sm transition ${tab === 'concluidos' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
          Concluídos ({resolved.length})
        </Link>
      </div>

      {tab === 'abertos' ? (
        <CbxCard title="Tickets em aberto">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>{headRow}</thead>
              <tbody>
                {open.map(ticketRow)}
                {open.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">Nenhum ticket em aberto.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CbxCard>
      ) : (
        <div className="space-y-3">
          {clientGroups.length === 0 && (
            <CbxCard><p className="py-6 text-center text-sm text-slate-500">Nenhum ticket concluído ainda.</p></CbxCard>
          )}
          {clientGroups.map((cg, i) => (
            <details key={cg.client} open={i === 0} className="rounded-xl border border-white/10 bg-white/[0.02]">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.03]">
                <span>📁 {cg.client}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{cg.count}</span>
              </summary>
              <div className="space-y-2 px-3 pb-3">
                {cg.months.map((mg) => (
                  <details key={mg.label} className="rounded-lg border border-white/5 bg-white/[0.02]">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.03]">
                      <span>🗂️ {mg.label}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">{mg.items.length}</span>
                    </summary>
                    <div className="overflow-x-auto px-2 pb-2">
                      <table className="w-full min-w-[700px] text-sm">
                        <thead>{headRow}</thead>
                        <tbody>{mg.items.map(ticketRow)}</tbody>
                      </table>
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

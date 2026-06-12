import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cbxMe, hasPerm } from '../_lib'
import { CbxCard, CbxFlash, Pill, btnCbx, btnGhostCbx, inputCbx, labelCbx, thCbx, tdCbx, fmtDate } from '../_ui'
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

export default async function CbxSuportePage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const me = await cbxMe()
  if (!me.is_staff || !hasPerm(me, 'SUPORTE')) notFound()
  const { ok, err } = await searchParams
  const flash = FLASH[ok ?? err ?? ''] ?? {}

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Suporte</h1>
          <p className="mt-1 text-sm text-slate-400">{open.length} ticket(s) em aberto.</p>
        </div>
        <Link href="/cbx/suporte/acessos" className={btnGhostCbx}>
          Acessos temporários →
        </Link>
      </div>

      <CbxFlash {...flash} />

      {/* Novo ticket */}
      <CbxCard title="Abrir ticket">
        <form action={createTicket} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCbx}>Cliente</label>
            <select name="holding_id" required defaultValue="" className={`mt-1 ${inputCbx}`}>
              <option value="" disabled>Escolha o cliente</option>
              {clients.map((c) => (
                <option key={c.holding_id} value={c.holding_id}>{c.name}</option>
              ))}
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
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className={btnCbx}>Abrir ticket</button>
          </div>
        </form>
      </CbxCard>

      {/* Lista */}
      <CbxCard title="Tickets">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className={thCbx}>Ticket</th>
                <th className={thCbx}>Cliente</th>
                <th className={thCbx}>Tipo</th>
                <th className={thCbx}>Responsável</th>
                <th className={thCbx}>Status</th>
                <th className={thCbx}>Aberto em</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const st = STATUS_PILL[t.status]
                return (
                  <tr key={t.id} className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]">
                    <td className={tdCbx}>
                      <Link href={`/cbx/suporte/${t.id}`} className="font-semibold text-slate-100 hover:text-amber-300">
                        {t.title}
                      </Link>
                      {Number(t.comment_count) > 0 && (
                        <span className="ml-2 text-xs text-slate-500">💬 {t.comment_count}</span>
                      )}
                    </td>
                    <td className={`${tdCbx} text-slate-300`}>{t.client_name}</td>
                    <td className={tdCbx}>
                      <Pill tone={t.type === 'incidente' ? 'err' : 'info'}>
                        {t.type === 'incidente' ? 'Incidente' : 'Solicitação'}
                      </Pill>
                    </td>
                    <td className={`${tdCbx} text-slate-300`}>{t.assignee_name ?? '—'}</td>
                    <td className={tdCbx}><Pill tone={st.tone}>{st.label}</Pill></td>
                    <td className={`${tdCbx} text-slate-400`}>{fmtDate(t.created_at)}</td>
                  </tr>
                )
              })}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    Nenhum ticket ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CbxCard>
    </div>
  )
}

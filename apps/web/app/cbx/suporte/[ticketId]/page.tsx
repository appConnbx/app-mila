import { SubmitButton } from "@/components/pending";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cbxMe, hasPerm } from "../../_lib";
import { CbxCard, CbxFlash, Pill, btnCbx, fmtDate, inputCbx, labelCbx } from "../../_ui";
import { addTicketComment, updateTicket } from "../actions";

type Ticket = {
  id: string;
  holding_id: string | null;
  client_name: string;
  title: string;
  description: string | null;
  type: "incidente" | "solicitacao";
  status: "aberto" | "em_atendimento" | "resolvido";
  assignee_name: string | null;
  created_by_name: string | null;
  created_at: string;
  resolved_at: string | null;
};
type Comment = {
  id: string;
  author_name: string;
  body: string;
  audience: "internal" | "client";
  created_at: string;
};
type StaffOpt = { id: string; full_name: string };

const FLASH: Record<string, { ok?: string }> = {
  criado: { ok: "Ticket aberto." },
  salvo: { ok: "Ticket atualizado." },
  comentado: { ok: "Comentário registrado." },
};

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticketId: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const me = await cbxMe();
  if (!me.is_staff || !hasPerm(me, "SUPORTE")) notFound();
  const { ticketId } = await params;
  const { ok } = await searchParams;
  const flash = FLASH[ok ?? ""] ?? {};

  const supabase = await createClient();
  const sb = supabase as unknown as {
    rpc: (n: string, a?: Record<string, unknown>) => Promise<{ data: unknown }>;
  };
  const [ticketsRes, commentsRes, staffRes] = await Promise.all([
    sb.rpc("cbx_list_tickets", { p_status: null }),
    sb.rpc("cbx_ticket_comments", { p_id: ticketId }),
    sb.rpc("cbx_staff_options"),
  ]);
  const t = ((ticketsRes.data as Ticket[] | null) ?? []).find((x) => x.id === ticketId);
  if (!t) notFound();
  const comments = (commentsRes.data as Comment[] | null) ?? [];
  const staff = (staffRes.data as StaffOpt[] | null) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/cbx/suporte" className="text-sm text-slate-500 hover:text-white">
          ← Suporte
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">{t.title}</h1>
          <Pill tone={t.type === "incidente" ? "err" : "info"}>
            {t.type === "incidente" ? "Incidente" : "Solicitação"}
          </Pill>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {t.client_name} · aberto por {t.created_by_name ?? "—"} em {fmtDate(t.created_at)}
          {t.resolved_at && ` · resolvido em ${fmtDate(t.resolved_at)}`}
        </p>
      </div>

      <CbxFlash {...flash} />

      {t.description && (
        <CbxCard>
          <p className="whitespace-pre-wrap text-sm text-slate-200">{t.description}</p>
        </CbxCard>
      )}

      {/* Andamento */}
      <CbxCard title="Andamento">
        <form action={updateTicket} className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="id" value={t.id} />
          <div>
            <label htmlFor="cbx-ticket-status" className={labelCbx}>
              Status
            </label>
            <select
              id="cbx-ticket-status"
              name="status"
              defaultValue={t.status}
              className={`mt-1 ${inputCbx}`}
            >
              <option value="aberto">Aberto</option>
              <option value="em_atendimento">Em atendimento</option>
              <option value="resolvido">Resolvido</option>
            </select>
          </div>
          <div>
            <label htmlFor="cbx-ticket-assignee" className={labelCbx}>
              Responsável
            </label>
            <select
              id="cbx-ticket-assignee"
              name="assignee"
              defaultValue=""
              className={`mt-1 ${inputCbx}`}
            >
              <option value="">
                {t.assignee_name ? `(manter: ${t.assignee_name})` : "— sem responsável —"}
              </option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <SubmitButton className={btnCbx}>Salvar</SubmitButton>
          </div>
        </form>
      </CbxCard>

      {/* Comentários e interações */}
      <CbxCard title="Comentários e interações">
        <form action={addTicketComment} className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input type="hidden" name="id" value={t.id} />
          <input name="body" required placeholder="Registrar andamento…" className={inputCbx} />
          <select name="audience" defaultValue="internal" className={`${inputCbx} sm:w-48`}>
            <option value="internal">Nota interna</option>
            <option value="client">Interação (cliente vê)</option>
          </select>
          <SubmitButton className={`${btnCbx} shrink-0`}>Enviar</SubmitButton>
        </form>
        <ul className="space-y-2">
          {comments.map((c) => {
            const isClient = c.audience === "client";
            return (
              <li
                key={c.id}
                className={`rounded-lg px-3 py-2 ${isClient ? "border border-sky-500/20 bg-sky-500/5" : "bg-slate-900/40"}`}
              >
                <p className="text-sm text-slate-200">{c.body}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  {c.author_name} · {fmtDate(c.created_at)}
                  {isClient && <Pill tone="info">Visível ao cliente</Pill>}
                </p>
              </li>
            );
          })}
          {comments.length === 0 && (
            <li className="text-sm text-slate-500">Nenhum comentário ainda.</li>
          )}
        </ul>
      </CbxCard>
    </div>
  );
}

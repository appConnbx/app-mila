"use server";

import { generateTags } from "@/lib/auto-tags";
import { fmtDate, fmtDateTime } from "@/lib/datetime";
import { ACTIVE_HOLDING_COOKIE, createClient } from "@/lib/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createDemand(formData: FormData) {
  const cookieStore = await cookies();
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value;
  if (!holdingId) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Pessoa do usuário NA instância ativa (origem da demanda).
  const { data: meRows } = await supabase
    .from("people")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("holding_id", holdingId)
    .limit(1);
  const me = (meRows as unknown as { id: string }[] | null)?.[0]?.id;
  if (!me) redirect("/tasks");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const responsible_id = String(formData.get("responsible_id") ?? "");
  const priority = String(formData.get("priority") ?? "media");
  const due_date = String(formData.get("due_date") ?? "") || null;
  const event_id = String(formData.get("event_id") ?? "") || null;
  const visibility =
    String(formData.get("visibility") ?? "private") === "public" ? "public" : "private";
  if (!title || !responsible_id) redirect("/tasks/new");

  // Tags automáticas (regras por palavra-chave) geradas no cadastro.
  const tags = generateTags(title, description, priority);

  const { error } = await supabase.from("demands").insert({
    holding_id: holdingId,
    title,
    description,
    responsible_id,
    origin_id: me,
    priority,
    due_date,
    event_id,
    tags,
    visibility,
    channel: "web",
  } as never);

  // RLS pode bloquear (ex.: em empresa, quem não está em equipe não cria demanda).
  if (error) redirect("/tasks/new?error=create");

  revalidatePath("/tasks");
  redirect("/tasks");
}

export type CreateDemandResult = { ok: boolean; error?: "required" | "forbidden" | "session" };

/** Cria demanda e RETORNA o resultado (sem redirect) — para o modal de Nova
 *  Demanda fechar e o cliente dar router.refresh() sem trocar de página. */
export async function createDemandInline(formData: FormData): Promise<CreateDemandResult> {
  const cookieStore = await cookies();
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value;
  if (!holdingId) return { ok: false, error: "session" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "session" };

  const { data: meRows } = await supabase
    .from("people")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("holding_id", holdingId)
    .limit(1);
  const me = (meRows as unknown as { id: string }[] | null)?.[0]?.id;
  if (!me) return { ok: false, error: "forbidden" };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const responsible_id = String(formData.get("responsible_id") ?? "");
  const priority = String(formData.get("priority") ?? "media");
  const due_date = String(formData.get("due_date") ?? "") || null;
  const event_id = String(formData.get("event_id") ?? "") || null;
  const visibility =
    String(formData.get("visibility") ?? "private") === "public" ? "public" : "private";
  if (!title || !responsible_id) return { ok: false, error: "required" };

  const tags = generateTags(title, description, priority);
  const { error } = await supabase.from("demands").insert({
    holding_id: holdingId,
    title,
    description,
    responsible_id,
    origin_id: me,
    priority,
    due_date,
    event_id,
    tags,
    visibility,
    channel: "web",
  } as never);
  if (error) return { ok: false, error: "forbidden" };

  revalidatePath("/tasks");
  return { ok: true };
}

export type DemandThread = {
  observations: { id: string; body: string; author: string; when: string }[];
  history: { id: string; text: string; who: string; when: string }[];
};

/** Histórico + observações de uma demanda, já FORMATADOS (rótulos/datas/nomes),
 *  para o modal de visualização renderizar sem lógica de i18n no cliente. */
export async function getDemandThread(demandId: string): Promise<DemandThread> {
  const cookieStore = await cookies();
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value;
  if (!demandId || !holdingId) return { observations: [], history: [] };
  const supabase = await createClient();
  const locale = await getLocale();
  const td = await getTranslations("demands");
  const tdet = await getTranslations("demandDetail");

  const [obsRes, histRes, holdRes, peopleRes] = await Promise.all([
    supabase
      .from("demand_observations")
      .select("id, body, created_at, author:author_id(full_name)")
      .eq("demand_id", demandId)
      .order("created_at", { ascending: false }),
    supabase
      .from("demand_history")
      .select("id, field_changed, old_value, new_value, created_at, changed_by")
      .eq("demand_id", demandId)
      .order("created_at", { ascending: false }),
    supabase.from("holdings").select("timezone").eq("id", holdingId).single(),
    supabase.from("people").select("id, full_name").eq("holding_id", holdingId),
  ]);
  const tz =
    (holdRes.data as unknown as { timezone: string | null } | null)?.timezone ??
    "America/Sao_Paulo";
  const people = (peopleRes.data ?? []) as unknown as { id: string; full_name: string }[];
  const nameOf = (pid: string | null) =>
    pid ? (people.find((p) => p.id === pid)?.full_name ?? "—") : "—";
  const fieldLabel = (f: string) =>
    (
      ({
        status: tdet("fStatus"),
        responsible_id: tdet("fResponsible"),
        priority: tdet("fPriority"),
        due_date: tdet("fDue"),
      }) as Record<string, string>
    )[f] ?? f;
  const renderVal = (f: string, v: string | null) => {
    if (v === null || v === "") return "—";
    if (f === "status") return td(`status.${v}`);
    if (f === "priority") return td(`priority.${v}`);
    if (f === "responsible_id") return nameOf(v);
    if (f === "due_date") return fmtDate(v, locale, tz);
    return v;
  };

  const observations = (
    (obsRes.data ?? []) as unknown as {
      id: string;
      body: string;
      created_at: string;
      author: { full_name: string } | null;
    }[]
  ).map((o) => ({
    id: o.id,
    body: o.body,
    author: o.author?.full_name ?? "—",
    when: fmtDateTime(o.created_at, locale, tz),
  }));
  const history = (
    (histRes.data ?? []) as unknown as {
      id: string;
      field_changed: string;
      old_value: string | null;
      new_value: string | null;
      created_at: string;
      changed_by: string | null;
    }[]
  ).map((h) => ({
    id: h.id,
    text: `${fieldLabel(h.field_changed)}: ${renderVal(h.field_changed, h.old_value)} → ${renderVal(h.field_changed, h.new_value)}`,
    who: nameOf(h.changed_by),
    when: fmtDateTime(h.created_at, locale, tz),
  }));
  return { observations, history };
}

/** Adiciona observação (para o modal) e retorna ok; o cliente recarrega o thread. */
export async function addObservationInline(
  demandId: string,
  body: string,
): Promise<{ ok: boolean }> {
  const { supabase, holdingId, me } = await currentPersonId();
  const text = body.trim();
  if (!holdingId || !me || !demandId || !text) return { ok: false };
  await supabase
    .from("demand_observations")
    .insert({ holding_id: holdingId, demand_id: demandId, author_id: me, body: text } as never);
  revalidatePath(`/tasks/${demandId}`);
  return { ok: true };
}

async function currentPersonId() {
  const cookieStore = await cookies();
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !holdingId) return { supabase, holdingId, me: undefined as string | undefined };
  const { data } = await supabase
    .from("people")
    .select("id")
    .eq("auth_user_id", user.id)
    .eq("holding_id", holdingId)
    .limit(1);
  const me = (data as unknown as { id: string }[] | null)?.[0]?.id;
  return { supabase, holdingId, me };
}

/** Atualiza status/prioridade/prazo/responsável. O banco grava histórico (trigger). */
export async function updateDemand(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const patch: Record<string, unknown> = {};
  const status = String(formData.get("status") ?? "");
  const priority = String(formData.get("priority") ?? "");
  const responsible_id = String(formData.get("responsible_id") ?? "");
  const visibility = String(formData.get("visibility") ?? "");
  const due_raw = formData.get("due_date");
  if (status) patch.status = status;
  if (priority) patch.priority = priority;
  if (responsible_id) patch.responsible_id = responsible_id;
  if (visibility === "private" || visibility === "public") patch.visibility = visibility;
  if (due_raw !== null) patch.due_date = String(due_raw) || null;
  if (Object.keys(patch).length === 0) return;

  await supabase
    .from("demands")
    .update(patch as never)
    .eq("id", id);
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
}

/** Mudança rápida de status (botões no detalhe). */
export async function setDemandStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;
  await supabase
    .from("demands")
    .update({ status } as never)
    .eq("id", id);
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
}

/** Avanço de status inline na lista (chip clicável). Recebe args (não FormData).
 *  Trava otimista: só atualiza se o status no banco ainda for `from` (o que o
 *  usuário viu) — evita que cliques concorrentes reabram/sobrescrevam a transição
 *  de outra pessoa (em demandas delegadas/compartilhadas). */
export async function advanceDemandStatus(
  id: string,
  from: "nova" | "trabalhando" | "finalizada",
  to: "nova" | "trabalhando" | "finalizada",
) {
  const ok = (s: string) => ["nova", "trabalhando", "finalizada"].includes(s);
  if (!id || !ok(from) || !ok(to)) return;
  const supabase = await createClient();
  await supabase
    .from("demands")
    .update({ status: to } as never)
    .eq("id", id)
    .eq("status", from);
  // NÃO revalida '/tasks' aqui: o auto-refresh do server action cortaria a
  // animação de "estourar" no cliente. O componente chama router.refresh() no
  // tempo certo (após a animação). Revalida só o detalhe.
  revalidatePath(`/tasks/${id}`);
}

/** Pina/despina uma demanda como prioritária (destaque alaranjado). O RLS de
 *  update governa quem pode (responsável/criador/admin). */
export async function toggleDemandPinned(id: string, pinned: boolean) {
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("demands")
    .update({ pinned } as never)
    .eq("id", id);
  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
}

/** Exclui uma demanda. O RLS (demands_delete) garante: criador ou admin da holding. */
export async function deleteDemand(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("demands").delete().eq("id", id);
  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function addObservation(formData: FormData) {
  const { supabase, holdingId, me } = await currentPersonId();
  const demand_id = String(formData.get("demand_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!holdingId || !me || !demand_id || !body) return;
  await supabase
    .from("demand_observations")
    .insert({ holding_id: holdingId, demand_id, author_id: me, body } as never);
  revalidatePath(`/tasks/${demand_id}`);
}

import type { DemandCardLabels } from "@/components/demand-card";
import { DemandList, type DemandListItem, type ViewMode } from "@/components/demand-list";
import { NewDemandModal } from "@/components/new-demand-modal";
import { Avatar, Badge, EmptyState, Tag } from "@/components/ui";
import { fmtDayMonth } from "@/lib/datetime";
import { ACTIVE_HOLDING_COOKIE, createClient } from "@/lib/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

type Demand = {
  id: string;
  title: string;
  description: string | null;
  status: "nova" | "trabalhando" | "finalizada";
  priority: "baixa" | "media" | "alta";
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  tags: string[] | null;
  visibility: "private" | "public";
  pinned: boolean;
  responsible_id: string;
  origin_id: string;
  responsible: { full_name: string; auth_user_id: string | null } | null;
  event: { name: string } | null;
};

type Tab = "minhas" | "delegadas" | "compartilhadas";

const STATUS_VARIANT = { nova: "info", trabalhando: "warning", finalizada: "success" } as const;

function Kpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="glass p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-1 text-4xl font-bold tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

export default async function DemandasPage({
  searchParams,
}: { searchParams: Promise<{ view?: string; tab?: string }> }) {
  const t = await getTranslations("demands");
  const locale = await getLocale();
  const { view, tab: tabRaw } = await searchParams;
  const archived = view === "arquivadas";
  const tab: Tab = tabRaw === "delegadas" || tabRaw === "compartilhadas" ? tabRaw : "minhas";

  const cookieStore = await cookies();
  const holdingId = cookieStore.get(ACTIVE_HOLDING_COOKIE)?.value;
  if (!holdingId) redirect("/dashboard");
  const viewMode: ViewMode =
    cookieStore.get("mila_demands_view")?.value === "list" ? "list" : "card";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holdingData } = await supabase
    .from("holdings")
    .select("name, kind, timezone")
    .eq("id", holdingId)
    .single();
  const holding = holdingData as unknown as { name: string; kind: string } | null;
  const tz =
    (holdingData as unknown as { timezone: string | null } | null)?.timezone ?? "America/Sao_Paulo";

  const { data: meRows } = await supabase
    .from("people")
    .select("id")
    .eq("auth_user_id", user?.id ?? "")
    .eq("holding_id", holdingId)
    .limit(1);
  const me = (meRows as unknown as { id: string }[] | null)?.[0]?.id ?? "";

  // Dados + rótulos do modal de Nova Demanda (criação sem trocar de página).
  const isFamily = holding?.kind === "family";
  const [peopleRes, eventsRes, myTeamsRes] = await Promise.all([
    supabase
      .from("people")
      .select("id, full_name")
      .eq("is_active", true)
      .eq("holding_id", holdingId)
      .order("full_name"),
    supabase
      .from("events")
      .select("id, name")
      .eq("status", "aberto")
      .order("opened_at", { ascending: false }),
    supabase.from("team_members").select("team_id").eq("person_id", me),
  ]);
  const allActivePeople = (peopleRes.data ?? []) as unknown as { id: string; full_name: string }[];
  const eventsList = (eventsRes.data ?? []) as unknown as { id: string; name: string }[];
  // Responsável: só quem está na MESMA equipe que eu. Sem equipe (ex.: família
  // ou ainda não alocado) → mantém todos, para não esvaziar a lista.
  const myTeamIds = ((myTeamsRes.data ?? []) as unknown as { team_id: string }[]).map(
    (r) => r.team_id,
  );
  let peopleList = allActivePeople;
  if (myTeamIds.length) {
    const { data: mates } = await supabase
      .from("team_members")
      .select("person_id")
      .in("team_id", myTeamIds);
    const allowed = new Set<string>([
      me,
      ...((mates ?? []) as unknown as { person_id: string }[]).map((m) => m.person_id),
    ]);
    peopleList = allActivePeople.filter((p) => allowed.has(p.id));
  }
  const tn = await getTranslations("newDemand");
  const newDemandLabels = {
    triggerNew: t("new"),
    title: tn("title"),
    demand: tn("demand"),
    demandPlaceholder: isFamily ? tn("demandPlaceholderFamily") : tn("demandPlaceholder"),
    description: tn("description"),
    responsible: tn("responsible"),
    selectPlaceholder: tn("selectPlaceholder"),
    priority: tn("priority"),
    priorityLow: tn("priorityLow"),
    priorityMedium: tn("priorityMedium"),
    priorityHigh: tn("priorityHigh"),
    due: tn("due"),
    event: tn("event"),
    eventNone: tn("eventNone"),
    visibility: tn("visibility"),
    visPrivate: tn("visPrivate"),
    visPublic: isFamily ? tn("visPublicFamily") : tn("visPublicCorp"),
    visHint: isFamily ? tn("visHintFamily") : tn("visHintCorp"),
    cancel: tn("cancel"),
    submit: tn("submit"),
    createError: tn("createError"),
    requiredError: tn("createError"),
  };

  const { data, error } = await supabase
    .from("demands")
    .select(
      "id, title, description, status, priority, due_date, created_at, completed_at, tags, visibility, pinned, responsible_id, origin_id, responsible:responsible_id(full_name, auth_user_id), event:event_id(name)",
    )
    .order("created_at", { ascending: true });

  const all = (data ?? []) as unknown as Demand[];

  // Fotos dos responsáveis (perfil por auth_user_id)
  const respUids = Array.from(
    new Set(all.map((d) => d.responsible?.auth_user_id).filter(Boolean)),
  ) as string[];
  const photoMap = new Map<string, string>();
  if (respUids.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("auth_user_id, avatar_url")
      .in("auth_user_id", respUids);
    for (const p of (profs as unknown as
      | { auth_user_id: string; avatar_url: string | null }[]
      | null) ?? []) {
      if (p.avatar_url) photoMap.set(p.auth_user_id, p.avatar_url);
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = (d: Demand) => !!d.due_date && d.due_date < today && d.status !== "finalizada";

  // Conjuntos por relação com o usuário
  const mine = all.filter((d) => d.responsible_id === me);
  const delegated = all.filter((d) => d.origin_id === me && d.responsible_id !== me);
  const shared = all.filter(
    (d) => d.visibility === "public" && d.responsible_id !== me && d.origin_id !== me,
  );
  const base = tab === "delegadas" ? delegated : tab === "compartilhadas" ? shared : mine;
  const activeCount = (set: Demand[]) => set.filter((d) => d.status !== "finalizada").length;

  // KPIs acionáveis sobre tudo que me envolve: minhas + delegadas + compartilhadas (conjuntos disjuntos).
  const scope = [...mine, ...delegated, ...shared];
  const kpiPendentes = scope.filter((d) => d.status !== "finalizada").length;
  const kpiEmAndamento = scope.filter((d) => d.status === "trabalhando").length;
  const kpiProximas = scope.filter((d) => d.status !== "finalizada" && d.due_date === today).length;
  const kpiAtrasadas = scope.filter(isOverdue).length;

  const baseDone = base.filter((d) => d.status === "finalizada").length;
  // Lista ativa: 'trabalhando' em evidência no topo, depois 'nova'. Dentro de
  // cada grupo a ordem é a da query (created_at asc = mais antiga primeiro).
  const STATUS_RANK: Record<Demand["status"], number> = { trabalhando: 0, nova: 1, finalizada: 2 };
  const demands = (
    archived
      ? base.filter((d) => d.status === "finalizada")
      : base.filter((d) => d.status !== "finalizada")
  ).sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || STATUS_RANK[a.status] - STATUS_RANK[b.status],
  );

  const q = (params: { tab?: Tab; view?: string }) => {
    const sp = new URLSearchParams();
    if (params.tab && params.tab !== "minhas") sp.set("tab", params.tab);
    if (params.view) sp.set("view", params.view);
    const s = sp.toString();
    return s ? `/tasks?${s}` : "/tasks";
  };

  // Rótulo do prazo (faltam/atrasada/hoje/sem prazo)
  const todayDate = new Date(today + "T00:00:00");
  const deadlineLabel = (d: Demand) => {
    if (!d.due_date) return { text: t("noDue"), cls: "text-slate-500" };
    const due = new Date(d.due_date + "T00:00:00");
    const days = Math.round((due.getTime() - todayDate.getTime()) / 86400000);
    if (d.status !== "finalizada" && days < 0)
      return { text: t("overdue", { days: Math.abs(days) }), cls: "text-rose-400" };
    if (days === 0) return { text: t("dueToday"), cls: "text-amber-400" };
    return { text: t("remaining", { days }), cls: days <= 2 ? "text-amber-400" : "text-slate-400" };
  };
  // Progresso do TEMPO até o prazo (aberta dia 1, hoje dia 9, prazo dia 10 => ~90%).
  const deadlineProgress = (d: Demand) => {
    if (d.status === "finalizada") return { pct: 100, color: "bg-emerald-500" };
    if (!d.due_date) return { pct: 4, color: "bg-brand/50" };
    const start = new Date(d.created_at).getTime();
    const end = new Date(d.due_date + "T23:59:59").getTime();
    const now = Date.now();
    if (now > end) return { pct: 100, color: "bg-gradient-to-r from-rose-400 to-red-500" };
    const pct = Math.max(
      4,
      Math.min(100, Math.round(((now - start) / Math.max(1, end - start)) * 100)),
    );
    return {
      pct,
      color:
        pct >= 70
          ? "bg-gradient-to-r from-amber-400 to-amber-500"
          : "bg-gradient-to-r from-emerald-400 to-emerald-500",
    };
  };
  const fmtDate = (iso: string) => fmtDayMonth(iso, locale, tz);

  // Concluídas agrupadas por mês (mais recente primeiro)
  const completedItems = base.filter((d) => d.status === "finalizada");
  const groupMap = new Map<string, { key: string; label: string; sort: number; items: Demand[] }>();
  // Ano/mês no FUSO da instância (não do servidor), senão demandas concluídas
  // à noite podem cair no mês seguinte.
  const ymInTz = (iso: string) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
    }).formatToParts(new Date(iso));
    const y = Number(parts.find((p) => p.type === "year")!.value);
    const m = Number(parts.find((p) => p.type === "month")!.value) - 1;
    return { y, m };
  };
  for (const d of completedItems) {
    const { y, m } = ymInTz(d.completed_at ?? d.created_at);
    const key = `${y}-${String(m).padStart(2, "0")}`;
    if (!groupMap.has(key)) {
      const monthName = new Date(Date.UTC(y, m, 1)).toLocaleDateString(locale, {
        month: "long",
        timeZone: "UTC",
      });
      groupMap.set(key, {
        key,
        label: `${y} - ${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}`,
        sort: y * 100 + m,
        items: [],
      });
    }
    groupMap.get(key)!.items.push(d);
  }
  const monthGroups = Array.from(groupMap.values()).sort((a, b) => b.sort - a.sort);

  const statusLabels = {
    nova: t("status.nova"),
    trabalhando: t("status.trabalhando"),
    finalizada: t("status.finalizada"),
  };
  const pinLabel =
    locale === "en"
      ? "Pin as priority"
      : locale === "es"
        ? "Fijar como prioritaria"
        : "Pinar como prioritária";

  const cardLabels: DemandCardLabels = {
    status: statusLabels,
    pin: pinLabel,
    createdWord: t("createdWord"),
    dueWord: t("dueWord"),
    autoTag: t("autoTag"),
    overdueTag: t("legendOverdue"),
    priorityHigh: locale === "en" ? "High" : locale === "es" ? "Alta" : "Alta",
    close: locale === "en" ? "Close" : locale === "es" ? "Cerrar" : "Fechar",
    openFull: locale === "en" ? "Open full page" : "Abrir página completa",
    start: locale === "en" ? "Start" : locale === "es" ? "Empezar" : "Trabalhar",
    reopen: locale === "en" ? "Reopen" : "Reabrir",
    finish: locale === "en" ? "Finish" : "Concluir",
    observations: locale === "en" ? "Notes" : locale === "es" ? "Observaciones" : "Observações",
    history: locale === "en" ? "History" : locale === "es" ? "Historial" : "Histórico",
    obsPlaceholder:
      locale === "en"
        ? "Write a note…"
        : locale === "es"
          ? "Escribe una observación…"
          : "Escreva uma observação…",
    send: locale === "en" ? "Send" : "Enviar",
    noObs:
      locale === "en"
        ? "No notes yet."
        : locale === "es"
          ? "Sin observaciones."
          : "Sem observações.",
    noHistory:
      locale === "en" ? "No history." : locale === "es" ? "Sin historial." : "Sem histórico.",
    loading: locale === "en" ? "Loading…" : locale === "es" ? "Cargando…" : "Carregando…",
  };

  const toggleLabels = {
    view:
      locale === "en" ? "View mode" : locale === "es" ? "Modo de vista" : "Modo de visualização",
    card: locale === "en" ? "Cards" : locale === "es" ? "Tarjetas" : "Cards",
    list: locale === "en" ? "List" : "Lista",
  };

  // Item da lista ativa (dados serializáveis p/ o componente cliente DemandList,
  // que escolhe card ou linha conforme o modo).
  const itemOf = (d: Demand): DemandListItem => ({
    demand: {
      id: d.id,
      title: d.title,
      description: d.description,
      status: d.status,
      pinned: d.pinned,
      tags: d.tags ?? [],
      responsibleName: d.responsible?.full_name ?? "—",
      eventName: d.event?.name ?? null,
    },
    photoUrl: d.responsible?.auth_user_id
      ? (photoMap.get(d.responsible.auth_user_id) ?? null)
      : null,
    overdue: isOverdue(d),
    createdFmt: fmtDate(d.created_at),
    dueFmt: d.due_date ? fmtDate(d.due_date) : null,
    dueLabel: deadlineLabel(d),
    progress: deadlineProgress(d),
  });

  // Concluídas (arquivadas) = Link estático para o detalhe. A lista ATIVA usa o
  // componente cliente DemandList (card/linha + modal + PUFF).
  const cardOf = (d: Demand) => {
    const overdue = isOverdue(d);
    const dl = deadlineLabel(d);
    const prog = deadlineProgress(d);
    const tags = d.tags ?? [];
    const photoUrl = d.responsible?.auth_user_id
      ? (photoMap.get(d.responsible.auth_user_id) ?? null)
      : null;
    return (
      <Link
        key={d.id}
        href={`/tasks/${d.id}`}
        className={`glass relative flex gap-4 overflow-hidden p-5 pb-6 transition hover:border-brand/40 ${d.pinned ? "!border-orange-400/60 ring-1 ring-orange-400/40" : overdue ? "!border-rose-500/30" : ""}`}
      >
        <Avatar name={d.responsible?.full_name ?? "?"} src={photoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-100">{d.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {d.responsible?.full_name ?? "—"} · {t("createdWord")} {fmtDate(d.created_at)}
                {d.event && <span> · {d.event.name}</span>}
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[d.status]} className="shrink-0">
              {t(`status.${d.status}`)}
            </Badge>
          </div>
          {d.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-400">{d.description}</p>
          )}
          {(tags.length > 0 || overdue) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {overdue && <Tag tone="danger">#{t("legendOverdue")}</Tag>}
              {tags.map((tag) => (
                <Tag key={tag} tone={tag === "prioridade-alta" ? "danger" : "brand"}>
                  #{tag}
                </Tag>
              ))}
              {tags.length > 0 && <Tag tone="auto">⚙ {t("autoTag")}</Tag>}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              {t("dueWord")} {d.due_date ? fmtDate(d.due_date) : "—"}
            </span>
            <span className={`font-medium ${dl.cls}`}>{dl.text}</span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5">
          <div
            className={`h-full ${prog.color} transition-all`}
            style={{ width: `${prog.pct}%` }}
          />
        </div>
      </Link>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{holding?.name ?? t("instanceFallback")}</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t("title")}</h1>
        </div>
        <NewDemandModal
          people={peopleList}
          events={eventsList}
          isFamily={isFamily}
          labels={newDemandLabels}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={t("kpiPending")} value={kpiPendentes} accent="text-white" />
        <Kpi label={t("kpiInProgress")} value={kpiEmAndamento} accent="text-amber-400" />
        <Kpi label={t("kpiDueSoon")} value={kpiProximas} accent="text-blue-400" />
        <Kpi label={t("kpiOverdue")} value={kpiAtrasadas} accent="text-rose-400" />
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {t("loadError", { message: error.message })}
        </div>
      )}

      {/* Filtros: relação (esquerda) × situação (direita) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {(
            [
              ["minhas", t("tabMine"), activeCount(mine)],
              ["delegadas", t("tabDelegated"), activeCount(delegated)],
              ["compartilhadas", t("tabShared"), activeCount(shared)],
            ] as const
          ).map(([key, label, count]) => (
            <Link
              key={key}
              href={q({ tab: key as Tab, view: archived ? "arquivadas" : undefined })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === key ? "bg-brand/15 text-brand" : "text-slate-400 hover:text-white"}`}
            >
              {label} <span className="opacity-60">{count}</span>
            </Link>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
          <Link
            href={q({ tab })}
            className={`rounded-md px-3 py-1 text-sm transition ${!archived ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
          >
            {t("tabActive")} ({base.length - baseDone})
          </Link>
          <Link
            href={q({ tab, view: "arquivadas" })}
            className={`rounded-md px-3 py-1 text-sm transition ${archived ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
          >
            {t("tabArchived")} ({baseDone})
          </Link>
        </div>
      </div>

      {/* Lista ativa (flat) ou concluídas (agrupadas por mês) */}
      {!archived ? (
        demands.length === 0 ? (
          <div className="mt-4 glass p-10 text-center">
            <EmptyState>{t("empty")}</EmptyState>
          </div>
        ) : (
          <DemandList
            items={demands.map(itemOf)}
            labels={cardLabels}
            toggle={toggleLabels}
            defaultMode={viewMode}
          />
        )
      ) : (
        <div className="mt-4 space-y-3">
          {monthGroups.length === 0 && (
            <div className="glass p-10 text-center">
              <EmptyState>{t("emptyArchived")}</EmptyState>
            </div>
          )}
          {monthGroups.map((g, i) => (
            <details key={g.key} open={i === 0} className="glass overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.03]">
                <span>{g.label}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                  {g.items.length}
                </span>
              </summary>
              <div className="space-y-3 p-3 pt-0">{g.items.map((d) => cardOf(d))}</div>
            </details>
          ))}
        </div>
      )}

      {((!archived && demands.length > 0) || (archived && monthGroups.length > 0)) && (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> {t("legendOnTime")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> {t("legendNear")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" /> {t("legendOverdue")}
          </span>
          <span>{t("legendHint")}</span>
        </div>
      )}
    </div>
  );
}

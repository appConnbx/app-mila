"use client";

import { ConfirmButton } from "@/components/confirm-button";
import { SubmitButton } from "@/components/pending";
import { Avatar, Badge, Button, fieldClasses, labelClasses } from "@/components/ui";
import { useDialog } from "@/components/use-dialog";
import { fmtDateTime } from "@/lib/datetime";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  adminSetPassword,
  deletePerson,
  setHoldingAdmin,
  setPersonActive,
  updatePerson,
} from "../actions";

function genPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export type HoldingUser = {
  id: string;
  full_name: string;
  email: string | null;
  role_title: string | null;
  is_active: boolean;
  can_delegate: boolean;
  is_admin: boolean;
  teams: string[];
  avatar_url: string | null;
  last_sign_in_at: string | null;
  has_active_session: boolean;
};

type SortKey = "name" | "lastLogin" | "status";

export function UsersManager({
  users,
  flash,
  tz,
}: { users: HoldingUser[]; flash?: { kind: "ok" | "err"; text: string }; tz?: string }) {
  const t = useTranslations("structure");
  const locale = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pw, setPw] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fmt = (iso: string | null) => fmtDateTime(iso, locale, tz);

  // Acessibilidade do drawer: foco-trap + Esc + restaura o foco ao gatilho.
  const drawerRef = useDialog<HTMLDivElement>(!!openId, () => setOpenId(null));

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(s) ||
        (u.email ?? "").toLowerCase().includes(s) ||
        u.teams.some((tm) => tm.toLowerCase().includes(s)),
    );
  }, [q, users]);

  // Ordenação por coluna (nome, último acesso, status). Online conta como o
  // acesso mais recente para a coluna de login.
  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const loginValue = (u: HoldingUser) =>
      u.has_active_session
        ? Number.MAX_SAFE_INTEGER
        : u.last_sign_in_at
          ? Date.parse(u.last_sign_in_at)
          : 0;
    return [...filtered].sort((a, b) => {
      if (sortKey === "name") return a.full_name.localeCompare(b.full_name) * dir;
      if (sortKey === "status") return (Number(a.is_active) - Number(b.is_active)) * dir;
      return (loginValue(a) - loginValue(b)) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const curPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };
  const sortArrow = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  const open = users.find((u) => u.id === openId) ?? null;
  const reassignCandidates = users.filter((u) => u.id !== openId && u.is_active);

  const stat = (n: number, label: string) => (
    <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300">
      <b className="text-white">{n}</b> {label}
    </span>
  );

  return (
    <div>
      {flash && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            flash.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {flash.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-400">
          <span aria-hidden>🔎</span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="w-56 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 sm:w-72"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {stat(users.length, t("statsUsers"))}
          {stat(users.filter((u) => u.is_active).length, t("statsActive"))}
          {stat(users.filter((u) => u.has_active_session).length, t("statsOnline"))}
          {stat(users.filter((u) => u.is_admin).length, t("statsAdmins"))}
        </div>
      </div>

      {/* Tabela */}
      <div className="glass overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="uppercase tracking-wide transition hover:text-slate-200"
                >
                  {t("colUser")}
                  {sortArrow("name")}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {t("colTeams")}
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <button
                  type="button"
                  onClick={() => toggleSort("lastLogin")}
                  className="uppercase tracking-wide transition hover:text-slate-200"
                >
                  {t("colLastLogin")}
                  {sortArrow("lastLogin")}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className="uppercase tracking-wide transition hover:text-slate-200"
                >
                  {t("colStatus")}
                  {sortArrow("status")}
                </button>
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {t("colActions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((u) => (
              <tr
                key={u.id}
                className={`border-b border-white/5 last:border-0 ${u.is_active ? "" : "opacity-55"}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.full_name} size="sm" src={u.avatar_url} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{u.full_name}</span>
                        {u.is_admin ? (
                          <Badge variant="brand">◆ {t("adminBadge")}</Badge>
                        ) : (
                          <span className="text-[11px] text-slate-500">{t("memberRole")}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{u.email ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.teams.length ? (
                    <div className="flex flex-wrap gap-1">
                      {u.teams.map((tm) => (
                        <span
                          key={tm}
                          className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[11px] text-slate-300"
                        >
                          {tm}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.has_active_session ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {t("online")}
                    </span>
                  ) : (
                    <span className="text-slate-400">{fmt(u.last_sign_in_at)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.is_active ? "success" : "neutral"}>
                    {u.is_active ? t("active") : t("inactive")}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setOpenId(u.id);
                        setPw("");
                      }}
                    >
                      {t("edit")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  {t("none")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação (10 por página) */}
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-400">
          <span>{t("pagInfo", { page: curPage, total: pageCount })}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={curPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("pagPrev")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={curPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              {t("pagNext")}
            </Button>
          </div>
        </div>
      )}

      {/* Drawer de edição */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpenId(null)}
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            aria-labelledby="user-drawer-title"
            className="glass glow-top relative h-full w-full max-w-md overflow-y-auto p-6 outline-none sm:rounded-l-2xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={open.full_name} src={open.avatar_url} />
                <div>
                  <h3 id="user-drawer-title" className="text-lg font-semibold text-white">
                    {t("editUser")}
                  </h3>
                  <p className="text-xs text-slate-500">{open.email ?? "—"}</p>
                </div>
              </div>
              <button
                onClick={() => setOpenId(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>

            {/* Dados cadastrais */}
            <form action={updatePerson} className="mt-5 space-y-3">
              <input type="hidden" name="id" value={open.id} />
              <div>
                <label className={labelClasses}>{t("fullName")}</label>
                <input
                  name="full_name"
                  defaultValue={open.full_name}
                  className={`mt-1 ${fieldClasses}`}
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>{t("emailOptional")}</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={open.email ?? ""}
                  className={`mt-1 ${fieldClasses}`}
                />
              </div>
              <div>
                <label className={labelClasses}>{t("roleOptional")}</label>
                <input
                  name="role_title"
                  defaultValue={open.role_title ?? ""}
                  className={`mt-1 ${fieldClasses}`}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  name="can_delegate"
                  defaultChecked={open.can_delegate}
                  className="h-4 w-4 rounded border-white/20 bg-slate-900"
                />
                {t("canDelegate")}
              </label>
              <SubmitButton btnVariant="primary" className="w-full">
                {t("saveChanges")}
              </SubmitButton>
            </form>

            {/* Permissão / status / senha */}
            <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
              <form action={setHoldingAdmin}>
                <input type="hidden" name="person_id" value={open.id} />
                <input type="hidden" name="make" value={open.is_admin ? "0" : "1"} />
                <SubmitButton btnVariant="ghost" btnSize="sm" className="w-full justify-start">
                  {open.is_admin ? t("removeAdminRole") : t("makeAdmin")}
                </SubmitButton>
              </form>
              <form action={setPersonActive}>
                <input type="hidden" name="id" value={open.id} />
                <input type="hidden" name="active" value={open.is_active ? "0" : "1"} />
                <SubmitButton btnVariant="ghost" btnSize="sm" className="w-full justify-start">
                  {open.is_active ? t("deactivate") : t("activate")}
                </SubmitButton>
              </form>
            </div>

            {/* Definir senha (admin) */}
            <form
              action={adminSetPassword}
              className="mt-4 space-y-2 rounded-xl border border-white/10 bg-slate-900/40 p-3"
            >
              <input type="hidden" name="person_id" value={open.id} />
              <label className={labelClasses}>{t("setPassword")}</label>
              {open.email ? (
                <>
                  <div className="flex gap-2">
                    <input
                      name="password"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      placeholder={t("setPasswordPlaceholder")}
                      className={fieldClasses}
                    />
                    <button
                      type="button"
                      onClick={() => setPw(genPassword())}
                      className="shrink-0 rounded-lg border border-white/10 px-3 text-sm text-slate-300 transition hover:bg-white/10"
                    >
                      {t("generate")}
                    </button>
                  </div>
                  <SubmitButton
                    btnVariant="ghost"
                    btnSize="sm"
                    className="w-full justify-start"
                    disabled={pw.length < 8}
                  >
                    🔑 {t("setPasswordBtn")}
                  </SubmitButton>
                  <p className="text-xs text-slate-500">{t("setPasswordHint")}</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">{t("setPasswordNoEmail")}</p>
              )}
            </form>

            {/* Excluir (com reatribuição) */}
            <form action={deletePerson} className="mt-5 space-y-2 border-t border-white/10 pt-4">
              <input type="hidden" name="id" value={open.id} />
              <label className={labelClasses}>{t("reassignLabel")}</label>
              <select name="reassign_to" defaultValue="" className={fieldClasses}>
                <option value="">{t("reassignKeep")}</option>
                {reassignCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">{t("deleteUserHint")}</p>
              <ConfirmButton
                message={t("confirmDeletePerson")}
                className="w-full rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
              >
                🗑️ {t("delete")}
              </ConfirmButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

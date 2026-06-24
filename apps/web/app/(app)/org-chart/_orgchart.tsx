"use client";

import { Avatar } from "@/components/ui";
import { useDialog } from "@/components/use-dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Person = {
  name: string;
  avatar_url: string | null;
  headline: string | null;
  phone: string | null;
  skills: string[];
};
type Team = { id: string; name: string; is_active: boolean; admins: Person[]; members: Person[] };
type Area = { id: string; name: string; is_active: boolean; admins: Person[]; teams: Team[] };
type Org = {
  id: string;
  name: string;
  is_active: boolean;
  logo_url: string | null;
  admins: Person[];
  areas: Area[];
};
export type ChartData = {
  holding_name?: string;
  holding_logo?: string | null;
  holding_admins?: Person[];
  orgs: Org[];
};

// Logo de holding/organização com fallback para a inicial.
function NodeLogo({
  url,
  name,
  size,
}: { url: string | null | undefined; name: string; size: number }) {
  const cls = "shrink-0 rounded-lg object-cover ring-1 ring-white/10";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className={cls} style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-lg bg-brand/15 font-bold text-brand"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

type Selected = { type: string; name: string; admins: Person[]; members?: Person[] } | null;

export function OrgChart({ data }: { data: ChartData }) {
  const t = useTranslations("orgchart");
  const [sel, setSel] = useState<Selected>(null);
  const [person, setPerson] = useState<Person | null>(null);

  // Acessibilidade dos modais: foco-trap + Esc + restaura o foco.
  const selRef = useDialog<HTMLDivElement>(!!sel, () => setSel(null));
  const personRef = useDialog<HTMLDivElement>(!!person, () => setPerson(null));

  // Lista de pessoas clicáveis (abre o popup de perfil)
  const peopleList = (people: Person[], bullet: string, empty: string) =>
    people.length ? (
      <ul className="mt-2 space-y-1">
        {people.map((p) => (
          <li key={p.name}>
            <button
              type="button"
              onClick={() => setPerson(p)}
              className="inline-flex items-center gap-2 text-sm text-slate-200 transition hover:text-brand"
            >
              <Avatar name={p.name} src={p.avatar_url} size="sm" />
              <span className="underline-offset-2 hover:underline">
                {bullet} {p.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-1 text-sm text-slate-500">{empty}</p>
    );

  return (
    <div>
      {/* Holding (topo) */}
      {data.holding_name && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() =>
              setSel({
                type: t("holdingLabel"),
                name: data.holding_name!,
                admins: data.holding_admins ?? [],
              })
            }
            className="glass glow-top flex items-center gap-3 rounded-xl px-5 py-3 text-left transition hover:border-brand/50"
          >
            <NodeLogo url={data.holding_logo} name={data.holding_name} size={44} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">
                {t("holdingLabel")}
              </p>
              <p className="text-lg font-bold text-white">{data.holding_name}</p>
            </div>
          </button>
        </div>
      )}

      {data.orgs.length === 0 && (
        <div className="glass mt-6 p-10 text-center text-sm text-slate-500">{t("empty")}</div>
      )}

      <div className="mt-6 space-y-4">
        {data.orgs.map((o) => (
          <div key={o.id} className="glass p-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSel({ type: t("orgLabel"), name: o.name, admins: o.admins })}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm transition hover:border-brand/50 hover:bg-white/[0.08]"
              >
                <NodeLogo url={o.logo_url} name={o.name} size={22} />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-brand">
                  {t("orgLabel")}
                </span>
                <span className="font-medium text-slate-100">{o.name}</span>
              </button>
              <span className="text-xs text-slate-500">
                {t("areasCount", { count: o.areas.length })}
              </span>
            </div>

            <div className="mt-4 space-y-3 border-l border-white/10 pl-4">
              {o.areas.map((a) => (
                <div key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSel({ type: t("areaLabel"), name: a.name, admins: a.admins })}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm transition hover:border-brand/50 hover:bg-white/[0.08]"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {t("areaLabel")}
                    </span>
                    <span className="font-medium text-slate-100">{a.name}</span>
                  </button>
                  <div className="mt-2 flex flex-wrap gap-2 border-l border-white/5 pl-4">
                    {a.teams.map((tm) => (
                      <button
                        key={tm.id}
                        type="button"
                        onClick={() =>
                          setSel({
                            type: t("teamLabel"),
                            name: tm.name,
                            admins: tm.admins,
                            members: tm.members,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-medium text-cyan-200 transition hover:bg-brand/20"
                      >
                        {tm.name}
                        <span className="text-cyan-300/60">· {tm.members.length}</span>
                      </button>
                    ))}
                    {a.teams.length === 0 && (
                      <span className="text-xs text-slate-600">{t("noTeams")}</span>
                    )}
                  </div>
                </div>
              ))}
              {o.areas.length === 0 && (
                <span className="text-xs text-slate-600">{t("noAreas")}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal do nó (org/área/equipe) */}
      {sel && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          // biome-ignore lint/a11y/useSemanticElements: modal controlado por estado React (foco-trap/Escape via useDialog); <dialog> nativo exige showModal() e quebraria o controle
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSel(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                e.preventDefault();
                setSel(null);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={t("close")}
          />
          <div
            ref={selRef}
            tabIndex={-1}
            aria-labelledby="oc-sel-title"
            className="glass glow-top relative w-full max-w-md p-6 outline-none"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">
                  {sel.type}
                </p>
                <h3 id="oc-sel-title" className="text-lg font-bold text-white">
                  {sel.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSel(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("admins")}
              </p>
              {peopleList(sel.admins, "◆", t("noAdmins"))}
            </div>

            {sel.members !== undefined && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("members")}
                </p>
                {peopleList(sel.members, "•", t("noMembers"))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup de perfil da pessoa */}
      {person && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          // biome-ignore lint/a11y/useSemanticElements: modal controlado por estado React (foco-trap/Escape via useDialog); <dialog> nativo exige showModal() e quebraria o controle
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPerson(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                e.preventDefault();
                setPerson(null);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={t("close")}
          />
          <div
            ref={personRef}
            tabIndex={-1}
            aria-labelledby="oc-person-title"
            className="glass glow-top relative w-full max-w-sm p-6 outline-none"
          >
            <button
              type="button"
              onClick={() => setPerson(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label={t("close")}
            >
              ✕
            </button>
            <div className="flex flex-col items-center text-center">
              <Avatar name={person.name} src={person.avatar_url} size="lg" />
              <h3 id="oc-person-title" className="mt-3 text-lg font-bold text-white">
                {person.name}
              </h3>
              {person.headline && (
                <p className="mt-0.5 text-sm text-slate-400">{person.headline}</p>
              )}
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {person.phone && (
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500">📱</span> {person.phone}
                </div>
              )}
              {person.skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("skills")}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {person.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-brand/15 px-2 py-0.5 text-[12px] font-semibold text-cyan-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {!person.phone && person.skills.length === 0 && (
                <p className="text-sm text-slate-500">{t("noProfile")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

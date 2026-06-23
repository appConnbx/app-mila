"use client";

import { useState } from "react";
import { type CardDemand, DemandCard, type DemandCardLabels } from "./demand-card";

export type DemandListItem = {
  demand: CardDemand;
  photoUrl: string | null;
  overdue: boolean;
  createdFmt: string;
  dueFmt: string | null;
  dueLabel: { text: string; cls: string };
  progress: { pct: number; color: string };
};

export type ViewMode = "card" | "list";

export type DemandListLabels = {
  view: string; // rótulo acessível do seletor
  card: string;
  list: string;
};

const COOKIE = "mila_demands_view";

/** Lista ativa de demandas com seletor de visão (Cards × Lista). O modo é
 *  persistido em cookie (lido no servidor → sem flash); o toggle é instantâneo
 *  no cliente. Card e Lista compartilham o mesmo modal/ações/efeito PUFF. */
export function DemandList({
  items,
  labels,
  toggle,
  defaultMode,
}: {
  items: DemandListItem[];
  labels: DemandCardLabels;
  toggle: DemandListLabels;
  defaultMode: ViewMode;
}) {
  const [mode, setMode] = useState<ViewMode>(defaultMode);

  function pick(m: ViewMode) {
    if (m === mode) return;
    setMode(m);
    document.cookie = `${COOKIE}=${m}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <div className="mt-4">
      <div className="mb-3 flex justify-end">
        <div
          role="group"
          aria-label={toggle.view}
          className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1"
        >
          {(
            [
              ["card", toggle.card, ICON_CARD],
              ["list", toggle.list, ICON_LIST],
            ] as const
          ).map(([key, label, icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              aria-pressed={mode === key}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition ${
                mode === key ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={mode === "list" ? "space-y-2" : "space-y-3"}>
        {items.map((it) => (
          <DemandCard key={it.demand.id} variant={mode} labels={labels} {...it} />
        ))}
      </div>
    </div>
  );
}

const ICON_CARD = (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="4" width="18" height="7" rx="1.5" />
    <rect x="3" y="14" width="18" height="6" rx="1.5" />
  </svg>
);

const ICON_LIST = (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3.5" y1="6" x2="3.5" y2="6" />
    <line x1="3.5" y1="12" x2="3.5" y2="12" />
    <line x1="3.5" y1="18" x2="3.5" y2="18" />
  </svg>
);

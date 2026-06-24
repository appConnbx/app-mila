"use client";

import { createDemandInline } from "@/app/(app)/tasks/actions";
import { useDialog } from "@/components/use-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Person = { id: string; full_name: string };
type Event = { id: string; name: string };

export type NewDemandLabels = {
  triggerNew: string;
  title: string;
  demand: string;
  demandPlaceholder: string;
  description: string;
  responsible: string;
  selectPlaceholder: string;
  priority: string;
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  due: string;
  event: string;
  eventNone: string;
  visibility: string;
  visPrivate: string;
  visPublic: string;
  visHint: string;
  cancel: string;
  submit: string;
  createError: string;
  requiredError: string;
};

const inputCls =
  "mt-1 w-full rounded-lg border border-surface-border bg-slate-900/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-brand focus:ring-1 focus:ring-brand";
const labelCls = "block text-sm font-medium text-slate-300";

export function NewDemandModal({
  people,
  events,
  isFamily,
  labels: l,
}: {
  people: Person[];
  events: Event[];
  isFamily: boolean;
  labels: NewDemandLabels;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const dialogRef = useDialog<HTMLDivElement>(open, () => setOpen(false));

  // Trava o scroll do fundo enquanto o modal está aberto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createDemandInline(fd);
      if (res.ok) {
        setOpen(false);
        router.refresh(); // lista atualiza sem trocar de página
      } else {
        setError(res.error === "required" ? l.requiredError : l.createError);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
      >
        {l.triggerNew}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:place-items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            // biome-ignore lint/a11y/useSemanticElements: dialogo controlado por estado React (foco-trap/Escape via useDialog); <dialog> nativo exige showModal() e quebraria o controle
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-demand-title"
            className="glass glow-top my-auto w-full max-w-2xl p-6 outline-none"
          >
            <div className="flex items-center justify-between">
              <h2 id="new-demand-title" className="text-xl font-bold text-white">
                {l.title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={l.cancel}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="nd-title" className={labelCls}>
                  {l.demand}
                </label>
                <input
                  id="nd-title"
                  name="title"
                  required
                  placeholder={l.demandPlaceholder}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="nd-description" className={labelCls}>
                  {l.description}
                </label>
                <textarea id="nd-description" name="description" rows={3} className={inputCls} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nd-responsible" className={labelCls}>
                    {l.responsible}
                  </label>
                  <select
                    id="nd-responsible"
                    name="responsible_id"
                    required
                    defaultValue=""
                    className={inputCls}
                  >
                    <option value="" disabled>
                      {l.selectPlaceholder}
                    </option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="nd-priority" className={labelCls}>
                    {l.priority}
                  </label>
                  <select
                    id="nd-priority"
                    name="priority"
                    defaultValue="media"
                    className={inputCls}
                  >
                    <option value="baixa">{l.priorityLow}</option>
                    <option value="media">{l.priorityMedium}</option>
                    <option value="alta">{l.priorityHigh}</option>
                  </select>
                </div>
              </div>

              <div className={isFamily ? "" : "grid gap-4 sm:grid-cols-2"}>
                <div>
                  <label htmlFor="nd-due" className={labelCls}>
                    {l.due}
                  </label>
                  <input id="nd-due" name="due_date" type="date" className={inputCls} />
                </div>
                {!isFamily && (
                  <div>
                    <label htmlFor="nd-event" className={labelCls}>
                      {l.event}
                    </label>
                    <select id="nd-event" name="event_id" defaultValue="" className={inputCls}>
                      <option value="">{l.eventNone}</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="nd-visibility" className={labelCls}>
                  {l.visibility}
                </label>
                <select
                  id="nd-visibility"
                  name="visibility"
                  defaultValue="private"
                  className={inputCls}
                >
                  <option value="private">{l.visPrivate}</option>
                  <option value="public">{l.visPublic}</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">{l.visHint}</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  {l.cancel}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500 disabled:opacity-60"
                >
                  {pending && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/40 border-t-slate-900" />
                  )}
                  {l.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

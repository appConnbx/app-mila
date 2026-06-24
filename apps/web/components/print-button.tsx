"use client";

/** Aciona a impressão do navegador (salvar como PDF). Usado nos manuais. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
    >
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
        <path
          d="M6 7V3h8v4M6 14H4v-4a2 2 0 012-2h8a2 2 0 012 2v4h-2M6 12h8v5H6z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}

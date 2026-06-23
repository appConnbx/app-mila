"use client";

import { type Size, type Variant, buttonClasses } from "@/components/ui";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---------------- Spinner ---------------- */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className ?? "h-4 w-4")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

/* ---------------- SubmitButton ----------------
 * Botão de submit que reage ao estado da action do <form> pai (useFormStatus):
 * desabilita e mostra spinner enquanto a action roda — inclusive durante o
 * redirect, até a página de destino carregar. Cobre o intervalo em que o
 * NextTopLoader ainda não disparou (a ação de servidor roda antes da navegação).
 * - variant 'replace': troca o conteúdo pelo spinner (botões de texto).
 * - variant 'overlay': mantém o conteúdo (esmaecido) e sobrepõe o spinner (cards ricos).
 */
type SubmitButtonProps = {
  children: ReactNode;
  /** 'replace' (texto): troca conteúdo pelo spinner · 'overlay' (cards): sobrepõe o spinner. */
  mode?: "replace" | "overlay";
  /** Variante visual do Button (opcional). Quando definida, aplica as classes padrão. */
  btnVariant?: Variant;
  btnSize?: Size;
  className?: string;
  spinnerClassName?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function SubmitButton({
  children,
  mode = "replace",
  btnVariant,
  btnSize,
  className,
  spinnerClassName,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const busy = pending || disabled;
  const base = btnVariant ? buttonClasses(btnVariant, btnSize, className) : className;

  if (mode === "overlay") {
    return (
      <button
        type="submit"
        disabled={busy}
        aria-busy={pending}
        className={cn("relative", base)}
        {...props}
      >
        <span className={cn("block", pending && "opacity-40 transition")}>{children}</span>
        {pending && (
          <span className="absolute inset-0 grid place-items-center rounded-[inherit] bg-surface/40 backdrop-blur-[1px]">
            <Spinner className={spinnerClassName ?? "h-6 w-6 text-brand"} />
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={pending}
      className={cn("relative", base)}
      {...props}
    >
      <span
        className={cn("inline-flex items-center justify-center gap-1.5", pending && "invisible")}
      >
        {children}
      </span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner className={spinnerClassName} />
        </span>
      )}
    </button>
  );
}

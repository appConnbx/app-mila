"use client";

import { Spinner } from "@/components/pending";
import { useFormStatus } from "react-dom";

/** Botão de submit que pede confirmação antes de enviar e mostra spinner enquanto processa. */
export function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={className ? `relative ${className}` : "relative"}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <span className={pending ? "invisible" : ""}>{children}</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}

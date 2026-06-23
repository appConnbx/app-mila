"use client";

import {
  ANALYTICS_ENABLED,
  getConsent,
  isAnalyticsHost,
  isMarketingPath,
  setConsent,
} from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Banner de consentimento (LGPD/GDPR). Só aparece quando há pixel configurado,
// em página de marketing, e ainda não houve decisão. Recusar = não rastrear.
export function ConsentBanner() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (
      ANALYTICS_ENABLED &&
      isAnalyticsHost() &&
      isMarketingPath(pathname) &&
      getConsent() === null
    )
      setShow(true);
  }, [pathname]);

  if (!show) return null;

  const decide = (v: "granted" | "denied") => {
    setConsent(v);
    setShow(false);
    // Recarrega para o loader de pixels reavaliar o consentimento.
    if (v === "granted") window.location.reload();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-300">
          Usamos cookies para medir e melhorar sua experiência. Você pode aceitar ou recusar —
          recusar mantém só o essencial.{" "}
          <a href="/privacy" className="font-medium text-brand hover:underline">
            Saiba mais
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => decide("denied")}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5"
          >
            Recusar
          </button>
          <button
            onClick={() => decide("granted")}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

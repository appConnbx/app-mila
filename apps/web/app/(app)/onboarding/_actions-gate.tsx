"use client";

import { SubmitButton } from "@/components/pending";
import Link from "next/link";
import { useState } from "react";

export type GateLabels = {
  acceptPre: string;
  terms: string;
  and: string;
  privacy: string;
  goConfig: string;
  skip: string;
};

/** Aceite bloqueante dos Termos: enquanto a caixa não for marcada, os botões de
 *  concluir/pular ficam desabilitados. O aceite vai no form (terms_accepted) e
 *  é reforçado no servidor (finishOnboarding). */
export function OnboardingActionsGate({ labels: l }: { labels: GateLabels }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="space-y-4">
      <input type="hidden" name="terms_accepted" value={accepted ? "1" : "0"} />
      <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
        />
        <span>
          {l.acceptPre}{" "}
          <Link href="/terms" target="_blank" className="text-brand hover:underline">
            {l.terms}
          </Link>{" "}
          {l.and}{" "}
          <Link href="/privacy" target="_blank" className="text-brand hover:underline">
            {l.privacy}
          </Link>
          .
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton
          name="go"
          value="config"
          disabled={!accepted}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {l.goConfig}
        </SubmitButton>
        <SubmitButton
          disabled={!accepted}
          className="text-sm text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {l.skip}
        </SubmitButton>
      </div>
    </div>
  );
}

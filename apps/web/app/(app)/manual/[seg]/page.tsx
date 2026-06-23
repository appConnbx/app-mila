import { PrintButton } from "@/components/print-button";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Manual · appMila" };

type Section = { h: string; items: string[] };
type Manual = { title: string; intro: string; sections: Section[] };

export default async function ManualPage({ params }: { params: Promise<{ seg: string }> }) {
  const { seg } = await params;
  if (seg !== "empresa" && seg !== "familia") notFound();
  const t = await getTranslations("manual");
  const m = t.raw(seg) as Manual;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Barra de ações (oculta na impressão) */}
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link href="/onboarding" className="text-sm text-slate-400 transition hover:text-white">
          ← {t("backToApp")}
        </Link>
        <PrintButton label={t("downloadCta")} />
      </div>

      {/* Área imprimível */}
      <article className="manual-print-area glass p-8 print:border-0 print:bg-white print:p-0 print:text-slate-900">
        <header className="border-b border-white/10 pb-5 print:border-slate-200">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">appMila</p>
          <h1 className="mt-1 text-2xl font-bold text-white print:text-slate-900">{m.title}</h1>
          <p className="mt-2 text-sm text-slate-400 print:text-slate-600">{m.intro}</p>
        </header>

        <div className="mt-6 space-y-6">
          {m.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-base font-semibold text-white print:text-slate-900">{s.h}</h2>
              <ul className="mt-2 space-y-1.5">
                {s.items.map((it, j) => (
                  <li key={j} className="flex gap-2 text-sm text-slate-300 print:text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand print:bg-slate-400" />
                    {it}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

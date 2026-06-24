import { SubmitButton } from "@/components/pending";
import { ACTIVE_HOLDING_COOKIE, createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { finishMemberOnboarding } from "./actions";

export const metadata = { title: "Bem-vindo · appMila" };

type Holding = { name: string; kind: "corporate" | "family" };

export default async function WelcomeMemberPage() {
  const t = await getTranslations("memberOnboarding");
  const holdingId = (await cookies()).get(ACTIVE_HOLDING_COOKIE)?.value;
  if (!holdingId) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: hData }, { data: pRows }] = await Promise.all([
    supabase.from("holdings").select("name, kind").eq("id", holdingId).single(),
    supabase
      .from("people")
      .select("full_name")
      .eq("auth_user_id", user?.id ?? "")
      .eq("holding_id", holdingId)
      .limit(1),
  ]);
  const h = hData as unknown as Holding | null;
  if (!h) redirect("/dashboard");
  const firstName = (
    (pRows as unknown as { full_name: string }[] | null)?.[0]?.full_name ??
    user?.email?.split("@")[0] ??
    ""
  ).split(" ")[0];
  const isFamily = h.kind === "family";
  const bullets = (isFamily ? t.raw("canFamily") : t.raw("canCorp")) as string[];

  return (
    <div className={`mx-auto max-w-2xl ${isFamily ? "theme-family" : ""}`}>
      <p className="text-sm font-semibold uppercase tracking-wider text-brand">appMila</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
        {t("welcome", { name: firstName })}
      </h1>
      <p className="mt-1 text-slate-400">{t("subtitle", { instance: h.name })}</p>

      {/* O que você pode fazer */}
      <div className="glass mt-6 p-5">
        <h2 className="text-base font-semibold text-white">{t("canTitle")}</h2>
        <ul className="mt-3 space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-200">
              <svg
                viewBox="0 0 20 20"
                width="16"
                height="16"
                fill="none"
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-brand"
              >
                <path
                  d="M4 10.5l4 4 8-9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Apps para produtividade */}
      <h2 className="mt-8 text-base font-semibold text-white">{t("appsTitle")}</h2>
      <p className="mt-1 text-sm text-slate-400">{t("appsDesc")}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {/* Celular */}
        <div className="glass flex flex-col p-5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
              <rect
                x="7"
                y="2.5"
                width="10"
                height="19"
                rx="2.2"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path d="M11 18.5h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="mt-3 font-semibold text-white">{t("mobileTitle")}</h3>
          <p className="mt-1 flex-1 text-sm text-slate-400">{t("mobileDesc")}</p>
          <a
            href="https://www.appmila.co"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            {t("mobileCta")}
          </a>
        </div>
        {/* Agente Windows */}
        <div className="glass flex flex-col p-5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M3 5.5L10.5 4.4v7.1H3V5.5zM11.6 4.2L21 3v8.5h-9.4V4.2zM3 12.5h7.5v7.1L3 18.5v-6zM11.6 12.5H21V21l-9.4-1.2v-7.3z" />
            </svg>
          </div>
          <h3 className="mt-3 font-semibold text-white">{t("agentTitle")}</h3>
          <p className="mt-1 flex-1 text-sm text-slate-400">{t("agentDesc")}</p>
          <a
            href="/api/agent/download"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-500"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("agentCta")}
          </a>
        </div>
      </div>

      {/* Começar */}
      <form
        action={finishMemberOnboarding}
        className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-5"
      >
        <SubmitButton className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-500">
          {t("start")}
        </SubmitButton>
      </form>
    </div>
  );
}

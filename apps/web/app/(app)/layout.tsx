import { LanguageSwitcher } from "@/components/language-switcher";
import { SubmitButton } from "@/components/pending";
import { ThemeToggle } from "@/components/theme-toggle";
import { Aurora } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import { ACTIVE_HOLDING_COOKIE, createClient } from "@/lib/supabase/server";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NavLinks } from "./_nav";
import { exitInstance } from "./dashboard/actions";

type Holding = {
  name: string;
  kind: "corporate" | "family";
  legal_name: string | null;
  onboarding_done: boolean;
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const pathname = (await headers()).get("x-pathname") ?? "";
  const activeHolding = (await cookies()).get(ACTIVE_HOLDING_COOKIE)?.value;
  // "Home" = área inicial (dashboard pessoal + seleção): sem nav de instância.
  const isHome =
    !activeHolding ||
    pathname === "/dashboard" ||
    pathname.startsWith("/subscription") ||
    pathname.startsWith("/profile");

  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const initial = (user.email ?? "?").charAt(0).toUpperCase();

  const sb = supabase as unknown as { rpc: (name: string) => Promise<{ data: boolean | null }> };
  let holding: Holding | null = null;
  let isHoldingAdmin = false;
  let isManager = false;

  // Uma "onda" só de consultas (eram até 5 idas sequenciais ao banco por
  // navegação — principal causa da lentidão percebida).
  const profilePromise = supabase
    .from("profiles")
    .select("avatar_url")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (activeHolding) {
    const [hRes, adminRes, mgrRes, accessRes, memberRes] = await Promise.all([
      supabase
        .from("holdings")
        .select("name, kind, legal_name, onboarding_done")
        .eq("id", activeHolding)
        .single(),
      sb.rpc("is_holding_admin"),
      sb.rpc("is_manager"), // dashboard gerencial: admin de qualquer nível
      isHome ? Promise.resolve({ data: true }) : sb.rpc("holding_has_active_access"),
      sb.rpc("my_member_pending"),
    ]);
    holding = hRes.data as unknown as Holding | null;
    isHoldingAdmin = !!adminRes.data;
    isManager = !!mgrRes.data;

    // Guard de assinatura ativa (rotas de instância).
    if (!isHome && !accessRes.data) redirect("/subscription");

    // Onboarding guiado de 1º acesso do ADMIN (configuração). Em qualquer rota,
    // exceto a própria trilha, o manual (baixado de lá) e o billing.
    if (
      isHoldingAdmin &&
      holding &&
      !holding.onboarding_done &&
      !pathname.startsWith("/onboarding") &&
      !pathname.startsWith("/manual") &&
      !pathname.startsWith("/subscription")
    ) {
      redirect("/onboarding");
    }

    // Onboarding de uso do MEMBRO (não-admin) no 1º acesso à instância.
    if (
      !isHoldingAdmin &&
      holding &&
      memberRes.data &&
      !pathname.startsWith("/welcome-member") &&
      !pathname.startsWith("/manual") &&
      !pathname.startsWith("/subscription")
    ) {
      redirect("/welcome-member");
    }
  }

  const { data: profData } = await profilePromise;
  const avatarUrl =
    (profData as unknown as { avatar_url: string | null } | null)?.avatar_url ?? null;

  const isFamily = holding?.kind === "family";
  const navItems = [
    // Dashboard (gerencial) para administradores de qualquer nível.
    ...(isManager ? [{ href: "/panel", label: t("nav.panel") }] : []),
    { href: "/tasks", label: t("nav.demands") },
    ...(!isFamily ? [{ href: "/events", label: t("nav.events") }] : []),
    // Organograma: visível a todos (corporativo).
    ...(!isFamily ? [{ href: "/org-chart", label: t("nav.orgchart") }] : []),
    ...(isHoldingAdmin ? [{ href: "/structure", label: t("nav.structure") }] : []),
  ];

  return (
    <div className={`min-h-screen ${isFamily ? "theme-family" : ""}`}>
      <Aurora />
      <header className="sticky top-0 z-10 border-b border-white/5 bg-surface/70 backdrop-blur-xl">
        {/* Linha 1: marca + ações */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href={isHome ? "/dashboard" : "/tasks"}
            className="flex shrink-0 items-center gap-2"
          >
            <span className="text-xl font-bold tracking-tight text-white">appMila</span>
            <span className="h-4 w-1 rounded-full bg-brand" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isHome && holding && (
              <form action={exitInstance}>
                <SubmitButton className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
                  <span className="hidden sm:inline">
                    {t("nav.exitInstance", { name: holding.name })}
                  </span>
                  <span className="sm:hidden">{t("nav.exit")}</span>
                </SubmitButton>
              </form>
            )}
            <ThemeToggle />
            <LanguageSwitcher current={locale} />
            <span className="hidden text-sm text-slate-400 md:inline">{user.email}</span>
            <Link href="/profile" title={t("nav.profile")} className="shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={t("nav.profile")}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10 transition hover:ring-brand/50"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 text-sm font-semibold text-brand transition hover:bg-brand/25">
                  {initial}
                </span>
              )}
            </Link>
            <form action="/auth/signout" method="post">
              <SubmitButton className="rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white">
                {t("common.signOut")}
              </SubmitButton>
            </form>
          </div>
        </div>

        {/* Linha 2: navegação da instância (oculta na home) */}
        {!isHome && <NavLinks items={navItems} />}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </main>
    </div>
  );
}

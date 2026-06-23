import { Aurora } from "@/components/ui";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { RecoverForm } from "./_form";

export const metadata = { title: "Recuperar acesso · appMila", robots: { index: false } };

function toLocale(lang?: string) {
  return lang === "en" ? "en" : lang === "es" ? "es" : lang === "pt-BR" ? "pt-BR" : null;
}

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const locale = toLocale(lang) ?? (await getLocale());
  const t = await getTranslations({ locale, namespace: "access" });
  const tl = await getTranslations({ locale, namespace: "login" });

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Aurora />
      <div className="glass glow-top w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">appMila</h1>
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-brand" />
          <h2 className="mt-4 text-lg font-semibold text-white">{t("recoverTitle")}</h2>
          <p className="mt-1 text-sm text-slate-400">{t("recoverSubtitle")}</p>
        </div>
        <RecoverForm
          dict={{
            email: t("recoverEmail"),
            submit: t("recoverSubmit"),
            sent: t("recoverSent"),
            sending: t("setSaving"),
          }}
          lang={lang}
        />
        <div className="mt-5 text-center">
          <Link href="/login" className="text-sm text-slate-500 transition hover:text-white">
            {tl("submit")}
          </Link>
        </div>
      </div>
    </main>
  );
}

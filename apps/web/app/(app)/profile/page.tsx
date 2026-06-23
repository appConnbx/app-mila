import { createClient } from "@/lib/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangePassword } from "./_change-password";
import { ProfileEditor } from "./_editor";
import { FamilyAccount } from "./_family-account";

export default async function PerfilPage({
  searchParams,
}: { searchParams: Promise<{ famOk?: string; famErr?: string }> }) {
  const t = await getTranslations("profile");
  const { famOk, famErr } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sb = supabase as unknown as {
    rpc: (n: string) => Promise<{
      data: {
        person_id: string | null;
        is_corporate: boolean;
        family_holding: string | null;
      } | null;
    }>;
  };
  const { data: famStatus } = await sb.rpc("my_sponsored_family_status");
  const FAM_ERR: Record<string, string> = {
    campos: "famErrCampos",
    senha: "famErrSenha",
    confirm: "famErrConfirm",
    notcorp: "famErrNotcorp",
    exists: "famErrExists",
    auth: "famErrAuth",
  };
  const famErrMsg = famErr ? t((FAM_ERR[famErr] ?? "famErrGenerico") as "famErrGenerico") : null;

  const { data: profData } = await supabase
    .from("profiles")
    .select("avatar_url, phone, headline, skills")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const prof = profData as unknown as {
    avatar_url: string | null;
    phone: string | null;
    headline: string | null;
    skills: string[];
  } | null;

  const { data: persData } = await supabase
    .from("people")
    .select("full_name")
    .eq("auth_user_id", user.id)
    .limit(1);
  const name =
    (persData as unknown as { full_name: string }[] | null)?.[0]?.full_name ??
    user.email?.split("@")[0] ??
    "Usuário";

  const locale = await getLocale();
  const en = locale === "en";
  const es = locale === "es";
  const cpLabels = {
    title: en ? "Change password" : es ? "Cambiar contraseña" : "Alterar senha",
    newPw: en ? "New password" : es ? "Nueva contraseña" : "Nova senha",
    confirmPw: en
      ? "Confirm new password"
      : es
        ? "Confirmar nueva contraseña"
        : "Confirmar nova senha",
    submit: en ? "Change password" : es ? "Cambiar contraseña" : "Alterar senha",
    success: en
      ? "Password changed successfully."
      : es
        ? "Contraseña cambiada con éxito."
        : "Senha alterada com sucesso.",
    errShort: en
      ? "Password must be at least 8 characters."
      : es
        ? "La contraseña debe tener al menos 8 caracteres."
        : "A senha precisa ter pelo menos 8 caracteres.",
    errMismatch: en
      ? "Passwords do not match."
      : es
        ? "Las contraseñas no coinciden."
        : "As senhas não coincidem.",
    errFail: en
      ? "Could not change the password."
      : es
        ? "No se pudo cambiar la contraseña."
        : "Não foi possível alterar a senha.",
  };

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-slate-400 transition hover:text-white">
        ← {t("back")}
      </Link>
      <div className="mt-3">
        <ProfileEditor
          uid={user.id}
          name={name}
          email={user.email ?? ""}
          initial={{
            avatar_url: prof?.avatar_url ?? null,
            phone: prof?.phone ?? null,
            headline: prof?.headline ?? null,
            skills: prof?.skills ?? [],
          }}
        />
      </div>

      {/* Segurança: alterar senha */}
      <ChangePassword labels={cpLabels} />

      {/* Conta família do colaborador (VIP CONNBX FAMILY) */}
      {famOk && (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {t("famOk")}
        </div>
      )}
      {famErrMsg && (
        <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {famErrMsg}
        </div>
      )}

      {famStatus?.is_corporate &&
        (famStatus.family_holding ? (
          <section className="glass mt-6 p-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎁</span>
              <h2 className="text-lg font-semibold text-white">{t("famHaveTitle")}</h2>
            </div>
            <p className="mt-2 text-sm text-slate-400">{t("famHaveDesc")}</p>
          </section>
        ) : (
          <FamilyAccount defaultName={name} />
        ))}
    </div>
  );
}

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cbxMe, hasPerm } from "../_lib";

const PERMS = ["CEO", "FINANCEIRO", "COMERCIAL", "SUPORTE", "ADMIN"] as const;

function readPerms(formData: FormData): string[] {
  return PERMS.filter((p) => formData.get(`perm_${p}`) === "on");
}

type RpcResult = { ok: boolean; reason?: string };
type Rpc = { rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: RpcResult | null }> };

/** Cria (ou reativa) um operador da equipe CONNBX. */
export async function createStaff(formData: FormData) {
  const me = await cbxMe();
  if (!hasPerm(me, "ADMIN")) redirect("/cbx/admin?err=forbidden");

  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const perms = readPerms(formData);
  if (!full_name || !email || perms.length === 0) redirect("/cbx/admin?err=campos");
  if (password.length < 6) redirect("/cbx/admin?err=senha");

  const admin = createAdminClient();
  const { data: created } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  let uid = created?.user?.id ?? null;
  let reused = false;
  if (!uid) {
    // E-mail já tem conta (pode ser um usuário cliente). Reaproveita o id e
    // NÃO troca a senha — evita sequestro de conta de cliente pelo portal.
    const sbAdmin = admin as unknown as {
      rpc: (n: string, a: Record<string, unknown>) => Promise<{ data: string | null }>;
    };
    const { data: existing } = await sbAdmin.rpc("auth_user_id_by_email", { p_email: email });
    uid = existing ?? null;
    reused = true;
  }
  if (!uid) redirect("/cbx/admin?err=auth");

  const supabase = await createClient();
  const { data } = await (supabase as unknown as Rpc).rpc("cbx_register_staff", {
    p_auth: uid,
    p_name: full_name,
    p_email: email,
    p_perms: perms,
  });
  revalidatePath("/cbx/admin");
  if (!data?.ok) redirect(`/cbx/admin?err=${data?.reason ?? "erro"}`);
  redirect(`/cbx/admin?ok=${reused ? "reaproveitado" : "criado"}`);
}

/** Atualiza permissões/status de um operador. */
export async function setStaff(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "1") === "1";
  const perms = readPerms(formData);
  if (!id) return;

  const supabase = await createClient();
  const { data } = await (supabase as unknown as Rpc).rpc("cbx_set_staff", {
    p_id: id,
    p_perms: perms,
    p_active: active,
  });
  revalidatePath("/cbx/admin");
  if (!data?.ok) redirect(`/cbx/admin?err=${data?.reason ?? "erro"}`);
  redirect("/cbx/admin?ok=salvo");
}

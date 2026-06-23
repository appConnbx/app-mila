"use server";

import { ACTIVE_HOLDING_COOKIE, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Conclui (ou pula) o onboarding. Marca a(s) holding(s) pendente(s) do usuário
 * via RPC (independe de instância ativa). Se for "entrar e configurar", já
 * seleciona a instância (cookie) e vai para a estrutura; senão, volta à home.
 */
export async function finishOnboarding(formData: FormData) {
  const goConfig = String(formData.get("go") ?? "") === "config";
  const holdingId = String(formData.get("holding_id") ?? "");
  const accepted = String(formData.get("terms_accepted") ?? "") === "1";

  // Aceite dos Termos é obrigatório para concluir o onboarding (bloqueante no
  // cliente; reforçado aqui no servidor). Sem aceite, volta ao onboarding.
  if (!accepted) redirect("/onboarding");

  const supabase = await createClient();
  const sb = supabase as unknown as { rpc: (n: string) => Promise<unknown> };
  await sb.rpc("accept_terms"); // registra data/hora do aceite (prova)
  await sb.rpc("finish_my_onboarding");
  revalidatePath("/", "layout");

  if (goConfig && holdingId) {
    (await cookies()).set(ACTIVE_HOLDING_COOKIE, holdingId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect("/structure");
  }
  redirect("/dashboard");
}

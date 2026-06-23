"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** Conclui o onboarding de uso do membro (marca a pessoa) e vai para as demandas. */
export async function finishMemberOnboarding() {
  const supabase = await createClient();
  const sb = supabase as unknown as { rpc: (n: string) => Promise<unknown> };
  await sb.rpc("finish_member_onboarding");
  revalidatePath("/", "layout");
  redirect("/tasks");
}

"use server";

import { redirect } from "next/navigation";

/**
 * CTA do hero/landing. Por ora encaminha para o acesso ao app.
 * (Captura de lead/cadastro será conectada em etapa futura — sem expor
 * dados pessoais via querystring.)
 */
export async function startNow() {
  redirect("/login");
}

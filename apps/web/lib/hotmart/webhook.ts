import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Processamento dos eventos do Webhook 2.0 da Hotmart para o APP MILA.
 * O parsing é defensivo (a estrutura do payload varia por evento).
 * Toda escrita usa o cliente admin (service_role), que ignora RLS.
 */

export type HotmartResult = {
  status: "processado" | "ignorado" | "erro";
  holdingId?: string | null;
  subscriptionId?: string | null;
  message?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

function pick<T = string>(obj: Any, path: string): T | undefined {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj) as T | undefined;
}

function toIso(epochOrIso: unknown): string | null {
  if (epochOrIso == null) return null;
  if (typeof epochOrIso === "number") return new Date(epochOrIso).toISOString();
  const n = Number(epochOrIso);
  if (!Number.isNaN(n) && String(epochOrIso).length >= 10) return new Date(n).toISOString();
  const d = new Date(String(epochOrIso));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Campos normalizados a partir do payload (cobre formatos comuns do 2.0). */
function normalize(payload: Any) {
  const data = payload?.data ?? payload;
  return {
    event: String(payload?.event ?? "").toUpperCase(),
    productId: pick(data, "product.id") != null ? String(pick(data, "product.id")) : undefined,
    offerCode:
      pick<string>(data, "purchase.offer.code") ?? pick<string>(data, "offer.code") ?? undefined,
    subscriberCode:
      pick<string>(data, "subscription.subscriber.code") ??
      pick<string>(data, "subscriber.code") ??
      undefined,
    transaction:
      pick<string>(data, "purchase.transaction") ?? pick<string>(data, "transaction") ?? undefined,
    buyerEmail: pick<string>(data, "buyer.email") ?? undefined,
    buyerName: pick<string>(data, "buyer.name") ?? undefined,
    nextCharge: toIso(
      pick(data, "purchase.date_next_charge") ?? pick(data, "subscription.date_next_charge"),
    ),
  };
}

type Admin = SupabaseClient;
type RpcAdmin = {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

async function resolvePlanId(
  admin: Admin,
  productId?: string,
  offerCode?: string,
): Promise<string | null> {
  if (!productId) return null;
  const sb = admin as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (c: string, v: string) => Any;
      };
    };
  };
  // tenta casar produto + oferta; se não achar, casa só por produto
  const q = sb.from("plans").select("id, external_offer_code").eq("external_product_id", productId);
  const { data } = (await q) as {
    data: { id: string; external_offer_code: string | null }[] | null;
  };
  const rows = data ?? [];
  if (rows.length === 0) return null;
  if (offerCode) {
    const match = rows.find((r) => r.external_offer_code === offerCode);
    if (match) return match.id;
  }
  return rows[0].id;
}

/** Garante um auth.users para o e-mail (convite) e retorna o id. */
async function ensureAuthUser(admin: Admin, email: string): Promise<string | null> {
  const base = process.env.APP_BASE_URL ?? "https://www.appmila.co";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${base}/auth/confirm?next=${encodeURIComponent("/create-password")}`,
  });
  if (!error && data?.user?.id) return data.user.id;
  // já registrado (ou e-mail não enviou): busca o id existente
  const { data: existing } = await (admin as unknown as RpcAdmin).rpc("auth_user_id_by_email", {
    p_email: email,
  });
  return (existing as string | null) ?? null;
}

async function findSubscriptionByCode(admin: Admin, code?: string, transaction?: string) {
  const sb = admin as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        or: (f: string) => { limit: (n: number) => Any };
        eq: (c: string, v: string) => { limit: (n: number) => Any };
      };
    };
  };
  if (code) {
    const { data } = (await sb
      .from("subscriptions")
      .select("id, holding_id")
      .eq("external_subscription_code", code)
      .limit(1)) as {
      data: { id: string; holding_id: string }[] | null;
    };
    if (data?.[0]) return data[0];
  }
  if (transaction) {
    const { data } = (await sb
      .from("subscriptions")
      .select("id, holding_id")
      .eq("external_transaction", transaction)
      .limit(1)) as {
      data: { id: string; holding_id: string }[] | null;
    };
    if (data?.[0]) return data[0];
  }
  return null;
}

export async function processHotmartEvent(admin: Admin, payload: Any): Promise<HotmartResult> {
  const f = normalize(payload);

  // ----- Provisionamento (compra aprovada) -----
  if (f.event === "PURCHASE_APPROVED" || f.event === "PURCHASE_COMPLETE") {
    if (!f.buyerEmail) return { status: "erro", message: "buyer.email ausente" };
    const planId = await resolvePlanId(admin, f.productId, f.offerCode);
    if (!planId)
      return {
        status: "ignorado",
        message: `plano não mapeado (product=${f.productId}, offer=${f.offerCode})`,
      };
    const authUserId = await ensureAuthUser(admin, f.buyerEmail);

    const { data, error } = await (admin as unknown as RpcAdmin).rpc("provision_from_hotmart", {
      p_plan_id: planId,
      p_external_subscription_code: f.subscriberCode ?? f.transaction ?? null,
      p_buyer_email: f.buyerEmail,
      p_buyer_name: f.buyerName ?? null,
      p_auth_user_id: authUserId,
      p_current_period_end: f.nextCharge,
      p_external_transaction: f.transaction ?? null,
    });
    if (error) return { status: "erro", message: error.message };
    const res = data as {
      ok: boolean;
      reason?: string;
      holding_id?: string;
      subscription_id?: string;
    };
    if (!res?.ok) return { status: "erro", message: res?.reason ?? "provision_failed" };
    return { status: "processado", holdingId: res.holding_id, subscriptionId: res.subscription_id };
  }

  // ----- Cancelamento (mantém acesso até o fim do período pago) -----
  if (f.event === "SUBSCRIPTION_CANCELLATION") {
    const sub = await findSubscriptionByCode(admin, f.subscriberCode, f.transaction);
    if (!sub) return { status: "ignorado", message: "assinatura não encontrada" };
    const sb = admin as unknown as {
      from: (t: string) => {
        update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> };
      };
    };
    await sb
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        current_period_end: f.nextCharge ?? undefined,
      })
      .eq("id", sub.id);
    return { status: "processado", holdingId: sub.holding_id, subscriptionId: sub.id };
  }

  // ----- Reembolso / chargeback / protesto: corta acesso já -----
  if (
    f.event === "PURCHASE_REFUNDED" ||
    f.event === "PURCHASE_CHARGEBACK" ||
    f.event === "PURCHASE_PROTEST"
  ) {
    const sub = await findSubscriptionByCode(admin, f.subscriberCode, f.transaction);
    if (!sub) return { status: "ignorado", message: "assinatura não encontrada" };
    const sb = admin as unknown as {
      from: (t: string) => {
        update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> };
      };
    };
    await sb
      .from("subscriptions")
      .update({ status: "suspended", updated_at: new Date().toISOString() })
      .eq("id", sub.id);
    await sb.from("holdings").update({ status: "suspended" }).eq("id", sub.holding_id);
    return { status: "processado", holdingId: sub.holding_id, subscriptionId: sub.id };
  }

  // ----- Atraso de cobrança: acesso segue até o fim do período -----
  if (f.event === "PURCHASE_DELAYED") {
    const sub = await findSubscriptionByCode(admin, f.subscriberCode, f.transaction);
    if (!sub) return { status: "ignorado", message: "assinatura não encontrada" };
    const sb = admin as unknown as {
      from: (t: string) => {
        update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> };
      };
    };
    await sb
      .from("subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("id", sub.id);
    return { status: "processado", holdingId: sub.holding_id, subscriptionId: sub.id };
  }

  // Demais eventos: registrados mas não acionam mudança de acesso.
  return { status: "ignorado", message: `evento sem tratamento: ${f.event}` };
}

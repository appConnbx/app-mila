// Cria/garante os produtos e preços do MILA (internacional, USD, mensal) na Stripe.
// Lê STRIPE_SECRET_KEY de apps/web/.env.local. Idempotente: produtos têm id fixo
// (mila_<plan>) e os preços só são criados se ainda não existir um equivalente.
// Uso: node scripts/stripe-setup.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", "apps", "web", ".env.local");
const env = readFileSync(envPath, "utf8");
const KEY = (env.match(/^STRIPE_SECRET_KEY=(.+)$/m) || [])[1]?.trim();
if (!KEY || !KEY.startsWith("sk_")) {
  console.error("STRIPE_SECRET_KEY não encontrada em", envPath);
  process.exit(1);
}
const isTest = KEY.startsWith("sk_test_");
console.log(`Usando chave ${isTest ? "de TESTE" : "de PRODUÇÃO ⚠️"}\n`);

const API = "https://api.stripe.com/v1";
const auth = { Authorization: `Bearer ${KEY}` };

// Codifica objeto em x-www-form-urlencoded com chaves aninhadas (metadata[x], recurring[y]).
function form(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}
async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: body ? form(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok && json.error?.code !== "resource_already_exists") {
    throw new Error(
      `${method} ${path} → ${res.status}: ${json.error?.message || JSON.stringify(json)}`,
    );
  }
  return json;
}

const PLANS = [
  {
    id: "mila_starter",
    name: "appMila Starter",
    amount: 8700,
    plan: "starter",
    segment: "corporate",
    users: "até 20 usuários",
  },
  {
    id: "mila_growth",
    name: "appMila Growth",
    amount: 16700,
    plan: "growth",
    segment: "corporate",
    users: "até 50 usuários",
  },
  {
    id: "mila_scale",
    name: "appMila Scale",
    amount: 33700,
    plan: "scale",
    segment: "corporate",
    users: "até 200 usuários",
  },
  {
    id: "mila_enterprise",
    name: "appMila Enterprise",
    amount: 66700,
    plan: "enterprise",
    segment: "corporate",
    users: "usuários ilimitados",
  },
  {
    id: "mila_family",
    name: "appMila Family",
    amount: 1300,
    plan: "family",
    segment: "family",
    users: "até 5 pessoas",
  },
  {
    id: "mila_family_plus",
    name: "appMila Family Plus",
    amount: 1700,
    plan: "family_plus",
    segment: "family",
    users: "até 10 pessoas",
  },
];

const result = [];
for (const p of PLANS) {
  // 1) Produto (id fixo → idempotente).
  let product = await api("GET", `/products/${p.id}`).catch(() => null);
  if (!product || product.error) {
    product = await api("POST", "/products", {
      id: p.id,
      name: p.name,
      metadata: { mila_plan: p.plan, mila_segment: p.segment, mila_users: p.users },
    });
    console.log(`+ produto ${p.id}`);
  } else {
    console.log(`= produto ${p.id} (já existia)`);
  }

  // 2) Preço mensal USD — reaproveita se já existir equivalente.
  const prices = await api("GET", `/prices?product=${p.id}&active=true&limit=100`);
  let price = (prices.data || []).find(
    (x) => x.currency === "usd" && x.unit_amount === p.amount && x.recurring?.interval === "month",
  );
  if (!price) {
    price = await api("POST", "/prices", {
      product: p.id,
      currency: "usd",
      unit_amount: p.amount,
      recurring: { interval: "month" },
      metadata: { mila_plan: p.plan },
    });
    console.log(`  + preço ${price.id} (US$${(p.amount / 100).toFixed(2)}/mês)`);
  } else {
    console.log(`  = preço ${price.id} (já existia)`);
  }
  result.push({ plan: p.plan, product: p.id, price: price.id, amount: p.amount });
}

console.log("\n=== MAPA plan → price_id (use na integração) ===");
console.log(JSON.stringify(Object.fromEntries(result.map((r) => [r.plan, r.price])), null, 2));

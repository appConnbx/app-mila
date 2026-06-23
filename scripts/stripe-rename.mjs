// Renomeia o NOME DE EXIBIÇÃO dos produtos na Stripe de "MILA X" para "appMila X".
// Só altera o campo `name` (aparece em checkout/fatura). IDs (mila_*) e metadados
// ficam intactos. Idempotente: rodar de novo não causa dano.
// Lê STRIPE_SECRET_KEY de apps/web/.env.local. Rode com a chave de PRODUÇÃO
// (sk_live) para valer no checkout real — e tambem com a de teste, se quiser.
// Uso: node scripts/stripe-rename.mjs
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

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: body ? new URLSearchParams(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(
      `${method} ${path} → ${res.status}: ${json.error?.message || JSON.stringify(json)}`,
    );
  return json;
}

// id fixo do produto → novo nome de exibição
const RENAMES = {
  mila_starter: "appMila Starter",
  mila_growth: "appMila Growth",
  mila_scale: "appMila Scale",
  mila_enterprise: "appMila Enterprise",
  mila_family: "appMila Family",
  mila_family_plus: "appMila Family Plus",
};

for (const [id, name] of Object.entries(RENAMES)) {
  const prod = await api("GET", `/products/${id}`).catch(() => null);
  if (!prod || prod.error) {
    console.log(`! produto ${id} não encontrado — pulando`);
    continue;
  }
  if (prod.name === name) {
    console.log(`= ${id} já é "${name}"`);
    continue;
  }
  await api("POST", `/products/${id}`, { name });
  console.log(`~ ${id}: "${prod.name}" → "${name}"`);
}
console.log("\nPronto. Confira em Stripe → Produtos.");

# 04 — Bootstrap do zero (conta nova)

Ordem de execução para re-erguer o appMila numa conta nova, sem segredos do ambiente antigo. Marque cada passo.

## Pré-requisitos (na máquina)
Node 20+, pnpm 9+, git, Supabase CLI, GitHub CLI (`gh`). Claude Code (opcional, para a inteligência).

## Passo 1 — Código (GitHub novo)
1. Obtenha o código: clone este repositório (é secret-free; segredos ficam no `.env`, que é gitignored).
2. Crie o repo na conta GitHub nova e aponte o remote:
   ```
   git remote set-url origin https://github.com/<conta-nova>/app-mila.git
   git push -u origin main
   ```
3. `pnpm install` e confira: `pnpm verify` (biome + typecheck) deve passar.

## Passo 2 — Banco (Supabase novo)
Siga `02-database.md`: criar projeto → `supabase link` → `supabase db push` (49 migrations) → `pnpm db:types`. Depois, no painel: Auth (e-mail/senha, senha ≥8, Redirect/Site URL do domínio novo), Storage (bucket `avatars` com limites), Edge Function `send-email` (deploy + `RESEND_API_KEY`).

## Passo 3 — Integrações (criar contas/produtos)
Siga `03-integrations.md`. Crie e anote os NOMES das variáveis (valores só na conta nova):
- Anthropic (API key), Stripe (keys + webhook + 6 produtos/preços), Hotmart (produto+ofertas+hottok), WhatsApp (app+número+tokens), Resend (domínio verificado + API key), GA4 (opcional).
- Popular `plans` com os `external_product_id`/offers reais do Stripe/Hotmart novos (UPDATE SQL ou seed).

## Passo 4 — Deploy (Vercel novo)
1. Importe o repo na Vercel (conta nova), root dir `apps/web`, framework Next.js.
2. Preencha **todas** as env vars (de `env.template`) em Settings → Environment Variables.
3. Deploy. Confirme produção READY.
4. Webhooks: configure os endpoints no Stripe (`/api/stripe/webhook`) e Hotmart (`/api/hotmart/webhook`) apontando para o domínio novo; cole o `STRIPE_WEBHOOK_SECRET`/`HOTMART_HOTTOK`.

## Passo 5 — Domínio e e-mail
1. Registrador/DNS (ex.: GoDaddy): A `@` + CNAME `www` → Vercel; adicione o domínio na Vercel.
2. E-mail receber: caixa + MX da raiz (cPanel/HostGator ou equivalente).
3. E-mail enviar: Resend → verificar subdomínio `send.` (DKIM/SPF no DNS).

## Passo 6 — Apps complementares
- **Mobile (Expo)**: `apps/mobile/.env` com `EXPO_PUBLIC_SUPABASE_*`; build via EAS; package `co.appmila.mobile` (troque se for outra marca).
- **Agente (Tauri)**: release por CI (tag `agent-v*`); secret `TAURI_SIGNING_PRIVATE_KEY` no GitHub Actions; link de download `/api/agent/download`.

## Passo 7 — Inteligência do Claude Code
Siga `01-intelligence.md`: habilite o plugin `connbx-saas` (marketplace `connbx-engineering`) e garanta o `CLAUDE.md` na raiz. Pronto — o Claude trabalha com o mesmo contexto.

## Checagem final (tudo funcionando)
- [ ] `pnpm verify` verde (local) e CI verde no repo novo.
- [ ] `supabase db push` aplicou as 49 migrations sem erro; `is_platform_admin`/RLS ok (advisor sem alertas críticos).
- [ ] Deploy de produção READY na Vercel; domínio resolvendo com SSL.
- [ ] Login funciona (criar usuário de teste); troca de instância escopa por RLS.
- [ ] Webhook de pagamento provisiona em sandbox (Stripe test / Hotmart sandbox).
- [ ] E-mail de convite chega (Resend) no idioma da conta.
- [ ] Agente instala e conecta na conta nova.

## Fora de escopo (por ser "do zero")
- **Dados de produção** (usuários, demandas reais) não são migrados aqui. Se precisar, faça export/import de dados à parte (respeitando LGPD) — não misture com a recriação de estrutura.
- **Segredos antigos** não entram: cada conta gera os seus.

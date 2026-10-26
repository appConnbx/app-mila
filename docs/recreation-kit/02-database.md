# 02 — Modelo de banco (recriar do zero)

O modelo de dados **inteiro** está versionado como migrations SQL em `apps/web/supabase/migrations/` (49 arquivos, nomeados por timestamp). Elas são a **fonte da verdade** — estrutura, RLS, RPCs, triggers, grants. **Sem dados, sem segredos.**

## Como recriar num Supabase novo
1. Crie um projeto Supabase novo (região South America / São Paulo é a usada hoje).
2. Instale a Supabase CLI e vincule:
   ```
   supabase link --project-ref <novo-project-ref>
   ```
3. Aplique TODAS as migrations na ordem (o CLI respeita o timestamp do nome):
   ```
   supabase db push
   ```
4. Gere os tipos para o código:
   ```
   pnpm db:types   # supabase gen types typescript > packages/supabase/src/database.types.ts
   ```
5. (Opcional) O `supabase/seed.sql` tem dados de exemplo (Ribeiro Caram + Família) — **não rode em produção**; serve só para dev/local.

> Alternativa a `db push`: aplicar via MCP do Supabase (um `apply_migration` por arquivo, em ordem). O resultado é o mesmo.

## Camadas do schema (visão)
Detalhe completo em `docs/MODELO_DADOS.md`. Em resumo:
- **Núcleo multi-tenant**: `holdings` (tenant, `kind` corporate|family) → `organizations` → `areas` → `teams` → `people` (uma por holding/usuário) + `memberships` (papel por escopo) + `team_members` (N:N) + `person_aliases`.
- **Objeto central**: `demands` (nova→trabalhando→finalizada) + `demand_observations` + `demand_history` + `events`/`event_participants`.
- **SaaS/cobrança**: `plans` (catálogo, preços BR/INTL, external_product_id/offer) + `subscriptions` + `billing_events` (idempotente).
- **Back-office (/cbx)**: `cbx_staff`, `cbx_client_profiles`, `cbx_tickets`, `cbx_ticket_comments`, `cbx_audit_log`, `cbx_business_types`, `cbx_support_access`, `platform_admins`.
- **Perfil/termos**: `profiles` (avatar/skills), `terms_accepted_at`.

## Helpers e segurança (recriados pelas migrations)
- `app.current_holding_id()` — revalida o header x-holding-id contra a membership (fecha IDOR).
- `app.has_role()`, `app.is_holding_admin()`, `public.is_platform_admin()`, `app.holding_has_active_access()`, limites de assento.
- `provision_subscription(provider, …)` / `provision_from_hotmart(…)` — provisionamento idempotente (SECURITY DEFINER, só service_role).
- RLS `ENABLE` em todas as tabelas de tenant; tabelas `cbx_*` com RLS **sem policy** (acesso só via RPC) — **padrão intencional**.
- Lockdown de grants: `anon`/`public` revogados das funções; só `authenticated`/`service_role`.

## Pós-recriação (configurações no painel, não-código)
- **Auth**: habilitar e-mail/senha; mínimo de senha ≥ 8; (Pro) Leaked Password Protection; Redirect URLs com o domínio novo; Site URL.
- **Storage**: bucket `avatars` (público) com `file_size_limit` 2MB + `allowed_mime_types` (png/jpeg/webp).
- **Edge Function** `send-email` (em `apps/web/supabase/functions/`): deploy + secret do Resend (ver `03-integrations.md`).

# appMila

SaaS multi-tenant de **gestão de demandas por voz** (web + mobile + agente desktop + WhatsApp). Marca formal **appMila**; "Mila" só como persona da assistente dentro do produto. Padrões de engenharia: plugin **connbx-saas** (skills) + repo `connbx-engineering`.

## Comandos
- Instalar: `pnpm install`
- Dev: `pnpm dev` · Web só: `pnpm --filter web dev`
- Build: `pnpm build` (Vercel publica `main` automaticamente) · Web: `pnpm --filter web build` (valida tsc + i18n)
- Typecheck/Lint: `pnpm typecheck` · `pnpm lint`
- Banco: `pnpm db:push` (aplica migrations) · `pnpm db:types` (regenera tipos)

## Stack
Next.js 15 (App Router) + TS + Tailwind + Supabase (Postgres/RLS/Auth/Storage) · Expo (mobile, `co.appmila.mobile`) · Tauri (agente desktop) · Turborepo + pnpm · Vercel. WhatsApp via Meta Cloud API; NLP via Claude API.

## Domínio
- **Tenant = `holding`** (`kind` corporate | family); **objeto central = `demanda`** (nova → trabalhando → finalizada).
- Instância ativa: cookie `mila_holding` → header `x-holding-id` → `app.current_holding_id()` (revalida no banco; **nunca confiar no cookie cru**).
- Identidade entre instâncias: um login = um `people` por holding.

## Regras inegociáveis
- **Multi-tenant com RLS** em toda tabela; o banco revalida o tenant. RPCs `SECURITY DEFINER` com gate na 1ª linha + `set search_path`.
- **Segredos só no servidor** (`service_role`/chaves nunca em `NEXT_PUBLIC_`).
- **Webhooks** (Stripe/Hotmart): assinatura + idempotência (`provider, external_event_id`) + status conservador (desconhecido → sem acesso).
- **Fonte única** de preços/planos (sem duplicar em telas).
- **Tema dark/light por tokens** (sem cores fixas; cuidado com variantes `hover:`). i18n pt-BR/en/es (nada hardcoded em tela de cliente; fuso da instância).
- **Concorrência**: optimistic lock (`.eq('status', from)`); autoria por coluna (`author_kind`), não por nome.
- **Portal /cbx é secreto**: 404 para não-staff, noindex, sem links em nenhuma superfície. Master `olivaldo@appmila.co`.

## Fluxo de trabalho
Branch → build/typecheck → PR → squash-merge em `main`. Migrations: aplicar no banco **E** versionar o `.sql`. Sempre backfill ao adicionar flags. Agente Tauri: build/assinatura por CI (tag `agent-v*`); modo Store (MSIX) sem updater.

## Skills (plugin connbx-saas)
`connbx-saas:saas-{product-architect,software-engineer,security-engineer,qa-engineer,ux-engineer}` — use ao planejar/implementar/auditar.

## Específico do appMila (não é padrão CONNBX)
WhatsApp + NLP por voz; gateways BR (Hotmart) + INTL (Stripe); afiliados; nomenclatura de domínio em PT (`holding`/`demanda`) — mantida por ser produção. Produtos novos usam o `saas-starter` (backend em inglês).

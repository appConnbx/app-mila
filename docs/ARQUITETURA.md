# Arquitetura e Decisões Técnicas — APP MILA

## Decisões fechadas

| # | Decisão | Escolha | Justificativa |
|---|---|---|---|
| D1 | Tenancy | Multi-tenant desde o início (`holding_id` + RLS) | Vira SaaS sem reescrita; isolamento garantido no banco |
| D2 | Web | Next.js 15 + TS + Tailwind + shadcn/ui | Padrão de mercado; deploy trivial na Vercel |
| D3 | Backend | Server Actions + Route Handlers (Next.js) | Menos infra; webhook isolado p/ WhatsApp |
| D4 | Banco/Auth | Supabase (Postgres + Auth + RLS) | Fundação multiempresa |
| D5 | Mobile | Expo / React Native + TS | Android+iOS de uma base; reaproveita código |
| D6 | Monorepo | Turborepo + pnpm | Web/mobile/regras numa fonte de verdade |
| D7 | WhatsApp | Meta Cloud API (oficial) | Estável e escalável; libs não-oficiais arriscam ban |
| D8 | NLP | Claude API (saída estruturada) | Extração robusta de campos da mensagem |
| D9 | Pessoa↔Equipe | N:N | Realidade organizacional |
| D10 | Permissões | RBAC por escopo + `can_delegate` | Cresce de 1 p/ N organizações |

## Diagrama

```
                 SUPABASE (Postgres + RLS + Auth + Storage)
                        ▲           ▲              ▲
                        │           │              │
              WEB (Next.js)   MOBILE (Expo)   WhatsApp Webhook
                Vercel                          (Route Handler)
                        \           |              /  └─ Claude API (NLP)
                         packages/shared + packages/supabase
```

## Princípios

- **RLS é a fronteira real**; a UI apenas esconde. Toda query passa por `auth.uid() → people → holding`.
- **Regras de negócio puras** em `@mila/shared`, testáveis e sem duplicação entre web e mobile.
- **Tipos do banco gerados** (`pnpm db:types`): mudança de schema quebra o build, não a produção.
- **Segredos só no servidor**: `service_role` e `ANTHROPIC_API_KEY` nunca vão ao cliente.

## Preparação SaaS (já embutida)

`holding_id` + RLS entregam isolamento. Billing já modelado (`plans`, `subscriptions`, `billing_events`).

### Duas verticais (mesmo motor)

- `holdings.kind = corporate | family`. Família = conta pequena (teto 5 usuários) com preços próprios.
- **Identidade entre instâncias**: um mesmo login (`auth_user_id`) tem um registro `people` por instância → participa de várias holdings e/ou famílias. A "instância ativa" vem do header `x-holding-id`, **sempre validada** no banco (`app.current_holding_id()`). UI mostra seletor de instância.

### Portal do Negócio (CONNBX) e super-admin

- `platform_admins` = equipe CONNBX (acima de todos os tenants).
- **Suporte/impersonação**: super-admin assume qualquer holding (`is_platform_admin()` libera `has_role`/`can_oversee` na instância assumida) — vê como admin para dar suporte.
- **Métricas globais** (nº de holdings/famílias, usuários por instância, atividades registradas/finalizadas, engajamento): app interno `apps/admin` no servidor com `service_role` (cross-tenant agregado).

### Planos e cobrança

- Catálogo em `plans` (vertical, usuários inclusos, preço, usuário extra). Pacotes: família 1–5; corporativo 10/20/100 + R$5/usuário acima de 100.
- **Ponto em aberto (negócio)**: faixas intermediárias corporativas (ex.: 35 usuários). Default atual: contratar o pacote que cobre os assentos. A definir.
- `subscriptions.seats` = assentos contratados; trigger bloqueia exceder o limite (família = teto rígido).

### Integração Hotmart (provedor de pagamento)

```
Hotmart (checkout/assinatura)
   │  webhook (postback) validado por HOTMART_HOTTOK
   ▼
Webhook MILA (Route Handler, service_role)
   ├─ registra em billing_events (idempotente)
   ├─ PURCHASE_APPROVED      → cria/ativa holding + subscription + admin (convite)
   ├─ SUBSCRIPTION_CANCEL... → status canceled / suspende acesso
   └─ PURCHASE_REFUNDED/CHARGEBACK/DELAYED → suspende acesso
```

- Holding = conta cobrável. Acesso = `app.holding_has_active_access()`.
- Provisionamento self-service: comprador vira `holding_admin`, recebe convite (Supabase Auth) para definir senha.
- Provider é extensível (`billing_provider` inclui `stripe`/`manual`) — Hotmart é o primeiro.
- Falta (etapa futura): código do webhook + criar o produto na Hotmart + configurar o `hottok`.

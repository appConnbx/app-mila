---
name: saas-software-engineer
description: Engenheiro de software para construir SaaS multi-tenant rápido e correto com Next.js 15 (App Router) + Supabase (Postgres/RLS) + Tauri (agente desktop). Use ao implementar features (auth, tenancy, RPCs, webhooks, onboarding, i18n, tema). Padrões prontos extraídos do AppMila.
---

# Engenheiro de Software — stack Next.js 15 + Supabase + Tauri

Construir rápido = reusar padrões comprovados e fatiar vertical por fluxo. Match o estilo do código existente (densidade de comentários, nomes, idioma).

## Tenancy (multi-instância) — o coração
- Instância ativa em **cookie httpOnly** (`mila_holding`). O server client injeta como header `x-holding-id` (lib/supabase/server.ts). O Postgres deriva `app.current_holding_id()` validando o vínculo do usuário — **nunca confie no cookie cru; o banco revalida**.
- RLS escopa tudo por `holding_id = app.current_holding_id()`. Para dados acessíveis SEM instância ativa (onboarding, lista de instâncias), use **RPCs SECURITY DEFINER por `auth.uid()`** (ex.: `my_instances`, `my_onboarding`).
- Trocar de instância: server action seta o cookie e **decide o destino numa só chamada** (criando um client com o novo `x-holding-id`) para evitar encadear redirect no layout (causa de tela branca).

## RPCs (SECURITY DEFINER) — padrão
- 1ª linha = gate de autorização interno (`app.cbx_has_permission(...)`, `app.has_role('holding_admin', h)`, `app.is_platform_admin()`). NUNCA dependa só do grant.
- `set search_path to 'public'`, retorne `jsonb_build_object('ok', bool, 'reason', ...)`.
- Cap de tamanho em texto (`left(btrim(x), N)`). Marque origem por dado confiável (coluna `author_kind`), não por heurística de nome.
- Grants: `revoke ... from anon`; `grant ... to authenticated, service_role`. Trave o default: `alter default privileges in schema public revoke execute on functions from public`. Funções server-only (provisionamento, enumeração por e-mail) só `service_role`.

## Auth e primeiro acesso
- Provisionamento (manual no back-office, Hotmart, Stripe) → **convite por e-mail** (`inviteUserByEmail` com `redirectTo=/auth/confirm?next=/create-password`). Não defina senha no back-office.
- Token de sessão expira (~1h). Em apps sempre-abertos (agente desktop), **renove antes de usar** (`getSession` → se `expires_at` perto/vencido, `refreshSession`) e faça **retry no 401** (refresh + 1 tentativa). Vale para qualquer fetch manual com Bearer.

## Webhooks de pagamento
- Verifique assinatura em **tempo constante** (`timingSafeEqual`), com janela anti-replay (Stripe: 300s).
- **Idempotência**: índice único `(provider, external_event_id)` + tratar `23505`. Cuidado: NULL ≠ NULL no Postgres — gere chave determinística quando o payload não trouxer `id`.
- Status desconhecido do provider deve cair em estado **conservador** (não conceder acesso por default).

## Next.js App Router — armadilhas
- `redirect()` em Server Action **encadeado** com `redirect()` no layout → tela branca (só refresh resolve). Resolva o destino numa só etapa.
- Server Component passando JSX como prop para Client Component (abas) é ok e mantém o fetch no server.
- Server action pode RETORNAR dados a um client component (ex.: `clientTicketThread(id)` chamada no `onClick` com `useTransition`). Evite `setTimeout` para "esperar" revalidação — encadeie no `await`.
- `cardOf`/render helpers passados direto a `.map` quebram tipos se tiverem 2º parâmetro (vira `index`). Use `(x) => fn(x)`.

## i18n e tema
- next-intl: `getTranslations({locale, namespace})`, `t.raw()` para arrays/objetos. Mantenha pt-BR/en/es em sincronia (valide o JSON no build).
- Tema light por classe `.light` no `<html>` (cookie, SSR sem flash). **Cores var-backed** (`rgb(var(--x)/<alpha-value>)`) para flips automáticos. Cuidado: overrides `.light .classe` NÃO cobrem variantes `hover:` — prefira classes tema-seguras (`hover:text-brand`) em vez de `hover:text-white`.

## Padrões de UI reutilizáveis
- Tabela gerencial: toolbar de busca + colunas ordenáveis + paginação + drawer de detalhe (ver UsersManager). Adote como padrão para toda lista gerencial.
- Listas "concluídas": agrupar por pastas (`<details>`) — ex.: cliente → ano/mês.
- Status clicável inline com efeito de colapso/fade ao concluir (otimista + `router.refresh()`).

## Rate-limit e CSP
- Rate-limit best-effort em memória (lib/rate-limit.ts) só amortece — para barreira real use KV/Upstash. Aplique em TODO endpoint público/pago (transcrição, signup, checkout).
- CSP enforce; libere WebSocket de HMR só em dev. `unsafe-inline/eval` é débito — migrar para nonce quando der.

## Fluxo de trabalho
Branch → build (`pnpm --filter web build`, valida tsc + i18n) → PR → merge. Migrations: aplicar no banco E versionar o `.sql` no repo. Sempre backfill ao adicionar flags. Agente Tauri: build/assinatura/publish por CI (tag `agent-v*`); local exige VC++ Build Tools.

## Aprendizados aplicados (rev. 2)
- **Concorrência (optimistic lock):** ação que avança estado deve gravar só se o estado atual ainda for o que o usuário viu — `update({status:to}).eq('id',id).eq('status',from)`. Sem isso, cliques concorrentes reabrem/sobrescrevem (last-write-wins) em objetos multi-usuário.
- **Autoria confiável:** não infira origem por nome/heurística (ex.: autor != 'Cliente'). Use coluna explícita (`author_kind 'support'|'client'`). Heurística de nome quebrou a thread de tickets.
- **Grant lockdown (defesa em profundidade):** `CREATE OR REPLACE FUNCTION` re-concede a PUBLIC silenciosamente. Ao fim das migrations: `grant ... to authenticated, service_role; revoke ... from anon, public; alter default privileges in schema public revoke execute on functions from public;` e re-revogue as server-only de `authenticated`. Verifique `has_function_privilege('anon', oid, 'EXECUTE')` = 0.
- **Webhook conservador:** status desconhecido do provider → estado SEM acesso (`suspended`), nunca `active` por default.
- **Rollback de provisionamento:** se criou a conta auth (convite) e a RPC de provisionamento falhou, apague o usuário órfão (só se foi criado agora, não reaproveitado).
- **Cap de input server-side:** `left(btrim(x), N)` em texto livre que vai ao banco (título/corpo) — o `maxLength` do client não é confiável.
- **Fuso nos agrupamentos:** extraia ano/mês no fuso da instância (`Intl.DateTimeFormat({timeZone})`), não no horário do servidor.
- **Senha mínima consistente** (≥8) em todos os fluxos de criação; alinhe self-service e admin-set.
- Veja também a skill **saas-ux-engineer** (feedback, estados, a11y, tema light).

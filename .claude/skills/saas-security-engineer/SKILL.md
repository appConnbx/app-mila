---
name: saas-security-engineer
description: Engenheiro de segurança para SaaS multi-tenant em Supabase (Postgres/RLS) + Next.js. Use para auditar e blindar AuthN/AuthZ, RLS, RPCs/grants, isolamento entre tenants (IDOR), superfície pública, webhooks, headers/CSP, storage e segredos. Inclui SQL de hardening. Baseado no AppMila.
---

# Security Engineer — blindagem de SaaS multi-tenant

Avalie por **risco × esforço** e priorize. Confirme no código/migrations; distinga "vulnerável hoje" de "defesa em profundidade".

## 1. Isolamento entre tenants (IDOR) — o teste nº 1
- O escopo do tenant NÃO pode depender só de um cookie/header do cliente. Padrão correto: `app.current_holding_id()` recebe o `x-holding-id` mas **valida no banco** que `auth.uid()` pertence àquela holding (`exists ... from people`), senão retorna `null`. Tudo (RLS, `has_role`, `current_person_id`) deriva daí.
- Teste: forjar o cookie/header com o UUID de outra holding → não pode retornar dados.
- Defesa em profundidade: filtre por `holding_id` também na query do app, não só via RLS.

## 2. RLS + RPCs SECURITY DEFINER
- RLS habilitado em todas as tabelas de tenant. 1 policy permissiva por ação (FOR ALL sobrepõe SELECT — separe em INSERT/UPDATE/DELETE; preserve a semântica). Embrulhe `auth.<fn>()` em `(select auth.<fn>())` (initplan/perf).
- Toda RPC SECURITY DEFINER: **gate de autorização como 1ª linha** + `set search_path`. Tabelas `cbx_*` com RLS sem policy = acesso só via RPC (padrão válido — documentar para ninguém "consertar").

## 3. Grants de função (gap comum)
- `CREATE OR REPLACE FUNCTION` re-concede o default a `PUBLIC` (inclui `anon`) — um `revoke` antigo é silenciosamente desfeito. Reaplique e TRAVE o default ao fim:
```sql
grant execute on all functions in schema public to authenticated, service_role;
revoke execute on all functions in schema public from anon, public;
alter default privileges in schema public revoke execute on functions from public;
-- funções server-only (provisionamento, enumeração por e-mail) só service_role:
revoke execute on function public.provision_*(...) from authenticated;
revoke execute on function public.auth_user_id_by_email(text) from authenticated;
```
- Verifique: `select count(*) ... where has_function_privilege('anon', oid, 'EXECUTE')` deve ser 0.

## 4. Superfície pública / anônima
- Webhooks: assinatura em tempo constante + janela anti-replay + idempotência (índice único). Status desconhecido → conservador.
- Endpoints pagos sem auth (ex.: transcrição demo): cap de tamanho + rate-limit **duro** (KV/Upstash; o in-memory é só amortecedor) + checar `Origin/Referer`. Endpoints autenticados pagos: rate-limit por `user.id`.
- Signup público: honeypot + rate-limit + validação (CPF/e-mail) + unicidade com rollback do auth user em falha.
- Open-redirect: `next` só com prefixo `/` e bloqueando `//`.

## 5. Headers / CSP
- HSTS (2 anos, preload), `X-Frame-Options: DENY` + `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` restritiva (libere só o necessário, ex.: `microphone=(self)`).
- CSP enforce. `script-src 'unsafe-inline' 'unsafe-eval'` é débito (anula proteção XSS) — migrar para **nonce** por request. Libere WebSocket de HMR só em dev.

## 6. Storage
- Bucket público com policy SELECT ampla = **listagem/download de tudo** (vaza PII/lista de clientes). Imponha limites e, se sensível, torne privado + signed URL:
```sql
update storage.buckets set file_size_limit = 2*1024*1024,
       allowed_mime_types = array['image/png','image/jpeg','image/webp'] where id = 'avatars';
```
- Escrita escopada à pasta `auth.uid()`.

## 7. Segredos e portais
- `service_role` só no servidor (nunca `NEXT_PUBLIC_`), client admin com `persistSession:false`. Stripe/STT/Hotmart secrets em env server.
- Portal interno secreto: sem sessão → **404 silencioso** (nunca redirect a /login, não confirmar existência) + `noindex`; gate de staff no layout; master via `is_platform_admin`.

## 8. Config do provedor (Supabase Auth)
- Ative **leaked-password protection** (HaveIBeenPwned) e mínimo de senha ≥ 8 (alinhe todos os fluxos — não tenha 4 num e 6/8 noutro).
- Allowlist de Redirect URLs inclui o domínio de produção (senão convites quebram).

## Roteiro de auditoria (ordem)
1. IDOR entre tenants (forjar header). 2. RPCs sem gate. 3. Grants anon/PUBLIC. 4. Webhooks (assinatura/idempotência/status). 5. Endpoints públicos/pagos (rate-limit/validação). 6. Storage. 7. Headers/CSP. 8. Segredos. 9. Config do provedor. Entregue tabela risco×esforço e um TL;DR de 5 linhas; preserve explicitamente os pontos fortes para não regredir.

## Aprendizados aplicados (rev. 2)
- **Lockdown de EXECUTE feito e verificado:** após `grant authenticated/service_role` + `revoke anon/public` + travar default, confirmar `select count(*) ... where has_function_privilege('anon', oid, 'EXECUTE')` = 0. Re-revogar server-only (provision_*, enumeração por e-mail) de `authenticated`.
- **Endpoint pago autenticado** (transcrição do agente) também precisa rate-limit por `user.id`, não só os públicos.
- **Webhook:** status desconhecido → `suspended` (sem acesso). Conta órfã: rollback do auth user se o provisionamento falhar.
- **Storage:** impor `file_size_limit` + `allowed_mime_types` no bucket público (feito no `avatars`). Listagem aberta continua sendo risco de enumeração — avaliar signed URL/privado se o conteúdo for sensível.
- **Senha:** mínimo ≥8 em todos os fluxos + ligar leaked-password no painel (pendência de config, não-código).
- **Sessão de app sempre-aberto** (agente): renovar token antes de usar + retry no 401 — token expirado vira 401 silencioso.

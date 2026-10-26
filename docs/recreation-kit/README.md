# Kit de Recriação — appMila

Guia **completo e portátil** para recriar o appMila **do zero numa conta nova** (GitHub, Supabase, Vercel, pagamentos, e-mail, domínio) — **sem segredos nem credenciais** do ambiente atual. Leva: a inteligência do Claude Code, o modelo de banco, o código e as integrações.

> **Política de segredos:** nada aqui contém chave, token ou senha. Os segredos do ambiente antigo **não** devem ser copiados — a conta nova gera os seus. Onde um valor é necessário, o kit diz **o nome da variável e onde obtê-la**, nunca o valor.

## O que é cada parte
| Arquivo | Conteúdo |
|---|---|
| [`01-intelligence.md`](01-intelligence.md) | **Inteligência do Claude Code**: CLAUDE.md, plugin `connbx-saas` (skills), base `connbx-engineering`, conhecimento destilado do produto. |
| [`02-database.md`](02-database.md) | **Modelo de banco**: as migrations (fonte da verdade), como aplicar num Supabase novo, visão do schema multi-tenant. |
| [`03-integrations.md`](03-integrations.md) | **Integrações**: cada serviço externo, para que serve, nome das variáveis e onde pegar a credencial. |
| [`env.template`](env.template) | **Todas as variáveis** (só nomes, sem valores) e onde cada uma vive. |
| [`04-bootstrap.md`](04-bootstrap.md) | **Passo a passo do zero** numa conta nova — ordem de execução. |

## O que o kit cobre vs. não cobre
- ✅ **Código**: já é secret-free no git. A conta nova clona o repo (ou um export dele). Veja `04-bootstrap.md`.
- ✅ **Banco (modelo)**: migrations em `apps/web/supabase/migrations/` — estrutura, RLS, RPCs. **Sem dados**.
- ✅ **Integrações**: lista completa + onde configurar.
- ✅ **Inteligência**: CLAUDE.md + skills + conhecimento.
- ❌ **Segredos/credenciais**: recriados na conta nova (nunca migrados).
- ❌ **Dados de produção** (usuários, demandas reais): não fazem parte de uma recriação "do zero". Se precisar migrar dados, é um export/import à parte (fora deste kit).

## Ordem recomendada (resumo)
1. **Código** → criar repo na conta nova a partir deste (clone + novo remote).
2. **Banco** → criar projeto Supabase novo → aplicar migrations (`02-database.md`).
3. **Integrações** → criar contas/produtos (Stripe, Hotmart, WhatsApp, Resend, Claude API) e anotar os nomes das variáveis (`03-integrations.md`).
4. **Deploy** → conectar o repo na Vercel, preencher as env vars, apontar o domínio (`04-bootstrap.md`).
5. **Inteligência** → habilitar o plugin `connbx-saas` e colar o CLAUDE.md (`01-intelligence.md`).

> Dica: se o objetivo é um **produto novo** (não recriar o appMila), use o **`saas-starter`** (template CONNBX, backend em inglês) em vez deste kit — ele já nasce limpo. Este kit é para **re-erguer o appMila** numa conta nova.

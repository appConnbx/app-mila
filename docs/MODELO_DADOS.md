# Modelo de Dados — APP MILA

Implementado em `supabase/migrations/`. Este documento explica o porquê.

## Hierarquia

```
HOLDING (grupo / tenant)
  └─ ORGANIZAÇÃO (empresa)
       └─ ÁREA
            └─ EQUIPE
                 └─ PESSOA  ──cria/recebe──> DEMANDAS ──agrupadas em──> EVENTOS
```

- **Tenant (isolamento SaaS) = `holding_id`**, presente em todas as tabelas. Uma empresa só é uma holding com uma organização.
- Cobrança futura é por **holding**.

## Tabelas (18 estruturas)

| # | Tabela | Papel |
|---|---|---|
| 1 | holdings | grupo / conta-raiz |
| 2 | organizations | empresas do grupo |
| 3 | areas | divisões |
| 4 | teams | equipes |
| 5 | people | usuários (liga a `auth.users`) |
| 6 | person_aliases | apelidos (reconhecimento WhatsApp) |
| 7 | team_members | Pessoa **N:N** Equipe |
| 8 | memberships | papéis por escopo (vários admins/nível) |
| 9 | events | agrupadores; sessão `aberto`/`fechado` |
| 10 | event_participants | Evento N:N Pessoa |
| 11 | demands | unidade de trabalho |
| 12 | demand_observations | observações de atividade |
| 13 | demand_history | auditoria automática |
| 14 | whatsapp_messages | log de ingestão |

**SaaS / Billing (Hotmart):**

| # | Tabela | Papel |
|---|---|---|
| 15 | plans | catálogo global de planos (mapeia produto/oferta Hotmart) |
| 16 | subscriptions | assinatura por holding (status controlado pela Hotmart) |
| 17 | billing_events | log de webhooks Hotmart (auditoria + idempotência) |

**Plataforma:**

| # | Tabela | Papel |
|---|---|---|
| 18 | platform_admins | equipe CONNBX (super-admin, acima dos tenants) |

(+ `holdings.kind` corporate/family, `holdings.status`, `holdings.billing_email`; + `plans.account_kind`/`included_users`/`extra_user_price_cents`; + `subscriptions.seats`; + schema `app` com enums e funções auxiliares.)

## Duas verticais e identidade entre instâncias

- `holdings.kind`: **corporate** (empresa/holding) ou **family** (uso pessoal/familiar, teto 5 usuários).
- Um mesmo login participa de **várias instâncias**: `people.auth_user_id` é único **por holding** (não global). A instância ativa vem do header `x-holding-id`, validada por `app.current_holding_id()`.
- **Super-admin (CONNBX)**: `platform_admins` pode assumir qualquer holding para suporte; libera `has_role`/`can_oversee` na instância assumida.
- **Limite de usuários**: `app.account_seat_limit()` + trigger `enforce_seat_limit` (família = teto rígido; corporativo = assentos do pacote).

## SaaS via Hotmart

- O **Hotmart é o provedor de pagamento**; o MILA reage aos webhooks dele.
- Compra aprovada → provisiona holding + assinatura + usuário admin (convite por e-mail).
- Cancelamento/chargeback/atraso → suspende o acesso da holding.
- Acesso liberado = `app.holding_has_active_access(holding)` (assinatura `trialing`/`active` e dentro do período).
- O **endpoint do webhook** (código) é implementado junto da web (Etapa 4/7); o banco já está pronto.

## Decisões-chave

- **Pessoa N:N Equipe** (`team_members`): pessoa pode estar em várias equipes.
- **Papéis** (`memberships`): `member`, `team_admin`, `area_admin`, `org_admin`, `holding_admin`. Cada linha = uma atribuição → **vários admins por nível** e uma pessoa pode acumular papéis.
- **Eventos dinâmicos**: abertos por comando ("começando o follow-up"), viram a **sessão ativa** da pessoa (`people.active_event_id`). Enquanto aberta, toda demanda criada por ela é vinculada automaticamente (trigger `before_demand_insert`). Fechados por comando. A orquestração abrir/fechar vive na aplicação; o vínculo automático vive no banco.

## Regras de integridade (no banco)

- Demanda exige `responsible_id`, `origin_id`, `status`, `priority`. `due_date` é opcional.
- `status` nasce `nova`; vira `completed_at` ao finalizar.
- Toda mudança de status/responsável/prioridade/prazo gera linha em `demand_history` (trigger).
- `holding_id`/`organization_id` da demanda derivam do responsável.

## Segurança (RLS) — quem vê o quê

| Papel | Visibilidade |
|---|---|
| Pessoa | suas demandas + as que criou + eventos que participa |
| team_admin | tudo da equipe |
| area_admin | tudo da área |
| org_admin | tudo da empresa |
| holding_admin | tudo do grupo |
| — | **nada de outra holding** (barreira absoluta) |

**Delegação**: criar demanda para terceiros exige `can_delegate = true` (revalidado no webhook do WhatsApp, que usa service_role e ignora RLS).

## Métrica de "talentos" (a definir na fase de indicadores)

Score ponderado: `(% conclusão no prazo) − (penalidade por atrasos) + (volume concluído, peso menor)`. Não é só volume.

-- ============================================================================
-- APP MILA — Migration 0004: SaaS / Billing (integração Hotmart)
-- O Hotmart é o provedor de pagamento. O MILA reage aos webhooks dele:
-- provisiona a holding + assinatura na compra e suspende no cancelamento.
-- A holding é a conta cobrável; acesso liberado = assinatura ativa.
-- A escrita destas tabelas pelo webhook usa service_role (ignora RLS por design).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type app.billing_provider     as enum ('hotmart','manual','stripe');
create type app.subscription_status  as enum ('trialing','active','past_due','canceled','suspended','expired');
create type app.holding_status       as enum ('pending','active','suspended','canceled');
create type app.billing_event_status as enum ('recebido','processado','ignorado','erro');

-- ----------------------------------------------------------------------------
-- HOLDINGS ganha estado de conta e e-mail de cobrança
-- (default 'active' mantém holdings criadas manualmente/seed funcionando)
-- ----------------------------------------------------------------------------
alter table public.holdings
  add column status        app.holding_status not null default 'active',
  add column billing_email text;

-- ----------------------------------------------------------------------------
-- PLANS — catálogo GLOBAL de planos (não é por holding)
-- Cada plano aponta para um produto/oferta na Hotmart.
-- ----------------------------------------------------------------------------
create table public.plans (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  description         text,
  provider            app.billing_provider not null default 'hotmart',
  external_product_id text,                          -- ID do produto na Hotmart
  external_offer_code text,                          -- código da oferta na Hotmart
  price_cents         integer,
  currency            text not null default 'BRL',
  billing_interval    text,                          -- 'monthly' | 'annual' | ...
  max_users           integer,                       -- limite de usuários (null = ilimitado)
  features            jsonb not null default '{}'::jsonb,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- SUBSCRIPTIONS — assinatura por holding (a conta cobrável)
-- ----------------------------------------------------------------------------
create table public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  holding_id                uuid not null references public.holdings(id) on delete cascade,
  plan_id                   uuid references public.plans(id) on delete set null,
  provider                  app.billing_provider not null default 'hotmart',
  status                    app.subscription_status not null default 'trialing',
  external_subscription_code text,                   -- subscriber_code da Hotmart
  external_transaction      text,                    -- transação da Hotmart
  buyer_email               text,
  current_period_end        timestamptz,
  trial_ends_at             timestamptz,
  canceled_at               timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index idx_subscriptions_holding on public.subscriptions (holding_id);
create unique index idx_subscriptions_ext_code on public.subscriptions (external_subscription_code)
  where external_subscription_code is not null;

-- ----------------------------------------------------------------------------
-- BILLING_EVENTS — log de webhooks (auditoria + idempotência)
-- O índice único em (provider, external_event_id) impede processar 2x o mesmo evento.
-- ----------------------------------------------------------------------------
create table public.billing_events (
  id                uuid primary key default gen_random_uuid(),
  provider          app.billing_provider not null default 'hotmart',
  event_type        text,
  external_event_id text,
  payload           jsonb,
  status            app.billing_event_status not null default 'recebido',
  holding_id        uuid references public.holdings(id) on delete set null,
  subscription_id   uuid references public.subscriptions(id) on delete set null,
  error_message     text,
  processed_at      timestamptz,
  created_at        timestamptz not null default now()
);
create unique index idx_billing_events_ext on public.billing_events (provider, external_event_id)
  where external_event_id is not null;

-- ----------------------------------------------------------------------------
-- updated_at automático
-- ----------------------------------------------------------------------------
create trigger trg_plans_updated         before update on public.plans         for each row execute function app.set_updated_at();
create trigger trg_subscriptions_updated before update on public.subscriptions for each row execute function app.set_updated_at();

-- ----------------------------------------------------------------------------
-- Acesso ativo? (usado pela aplicação para liberar/suspender a holding)
-- ----------------------------------------------------------------------------
create or replace function app.holding_has_active_access(_holding uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.holding_id = _holding
      and s.status in ('trialing','active')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.plans          enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.billing_events enable row level security;

-- Catálogo de planos: legível por qualquer usuário autenticado (página de planos).
create policy plans_select on public.plans
  for select to authenticated using (true);

-- Assinatura: admin da holding vê a própria.
create policy subscriptions_select on public.subscriptions
  for select using (holding_id = app.current_holding_id()
                    and app.has_role('holding_admin', holding_id));

-- Eventos de cobrança: admin da holding vê os da própria holding.
create policy billing_events_select on public.billing_events
  for select using (holding_id = app.current_holding_id()
                    and app.has_role('holding_admin', holding_id));

-- Escrita de plans/subscriptions/billing_events: somente via service_role (webhook),
-- que ignora o RLS por design. Não há policy de INSERT/UPDATE para usuários comuns.

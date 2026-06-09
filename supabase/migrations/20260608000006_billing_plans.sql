-- ============================================================================
-- APP MILA — Migration 0006: Planos (corporativo + familiar), assentos e limites
--   - Estende plans com vertical, usuários inclusos e preço de usuário extra
--   - subscriptions.seats = assentos contratados
--   - Limite de usuários por conta (família = teto rígido; corporativo = pacote)
--   - Catálogo inicial com a tabela de preços
-- Preços em centavos (BRL). external_product_id/offer_code preenchidos quando
-- os produtos forem criados na Hotmart.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extensões de plans e subscriptions
-- ----------------------------------------------------------------------------
alter table public.plans
  add column account_kind           app.account_kind not null default 'corporate',
  add column included_users         integer,            -- assentos inclusos no preço base
  add column extra_user_price_cents integer;            -- preço por usuário acima do incluso (overage)

alter table public.subscriptions
  add column seats integer;                             -- assentos contratados (pode exceder included c/ overage)

-- ----------------------------------------------------------------------------
-- 2. Limite de usuários por conta
--    Regra: assentos da assinatura, senão max_users do plano. Null = sem teto.
-- ----------------------------------------------------------------------------
create or replace function app.account_seat_limit(_holding uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(s.seats, p.max_users)
  from public.subscriptions s
  left join public.plans p on p.id = s.plan_id
  where s.holding_id = _holding
    and s.status in ('trialing','active')
  order by s.created_at desc
  limit 1;
$$;

create or replace function app.enforce_seat_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  lim  integer := app.account_seat_limit(new.holding_id);
  used integer;
begin
  if lim is null then
    return new;  -- sem assinatura/limite definido (ex.: trial, conta manual, seed)
  end if;
  select count(*) into used from public.people where holding_id = new.holding_id and is_active;
  if used >= lim then
    raise exception 'Limite de % usuário(s) atingido para esta conta. Faça upgrade do plano.', lim;
  end if;
  return new;
end;
$$;

create trigger trg_people_seat_limit
  before insert on public.people
  for each row execute function app.enforce_seat_limit();

-- ----------------------------------------------------------------------------
-- 3. Catálogo de planos (tabela de preços inicial)
-- ----------------------------------------------------------------------------
insert into public.plans
  (name, slug, account_kind, price_cents, currency, billing_interval, included_users, max_users, extra_user_price_cents, description)
values
  -- Familiar (teto rígido em 5)
  ('Família 1',  'familia-1', 'family',  2000, 'BRL', 'monthly', 1, 1, null, 'Uso pessoal — 1 usuário'),
  ('Família 2',  'familia-2', 'family',  3000, 'BRL', 'monthly', 2, 2, null, 'Família — até 2 pessoas'),
  ('Família 3',  'familia-3', 'family',  4000, 'BRL', 'monthly', 3, 3, null, 'Família — até 3 pessoas'),
  ('Família 4',  'familia-4', 'family',  5000, 'BRL', 'monthly', 4, 4, null, 'Família — até 4 pessoas'),
  ('Família 5',  'familia-5', 'family',  5500, 'BRL', 'monthly', 5, 5, null, 'Família — até 5 pessoas (máximo)'),
  -- Corporativo
  ('Corporativo 10',  'corp-10',  'corporate',  20000, 'BRL', 'monthly',  10,  10,  null, 'Empresa — 10 usuários (R$20/usuário)'),
  ('Corporativo 20',  'corp-20',  'corporate',  30000, 'BRL', 'monthly',  20,  20,  null, 'Empresa — 20 usuários (R$15/usuário)'),
  ('Corporativo 100', 'corp-100', 'corporate', 100000, 'BRL', 'monthly', 100, null,  500, 'Empresa — 100 usuários (R$10/usuário); acima de 100, R$5/usuário extra');

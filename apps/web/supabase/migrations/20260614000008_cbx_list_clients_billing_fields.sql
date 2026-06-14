-- Adiciona valor do plano (price_cents/moeda/intervalo) a cbx_list_clients para
-- a coluna de faturamento/valor do cliente. (billing_events nao guarda montante;
-- o faturado e estimado no app a partir do preco do plano x tempo de casa.)
drop function if exists public.cbx_list_clients();
create or replace function public.cbx_list_clients()
returns table(
  holding_id uuid, name text, kind text, holding_status text,
  plan_id uuid, plan_name text, seat_limit integer, used integer,
  is_unlimited boolean, sub_status text, provider text,
  business_type text, city text, state text, country text,
  contact_name text, created_at timestamptz,
  price_cents integer, currency text, billing_interval text
)
language sql stable security definer set search_path to 'public'
as $$
  select
    h.id, h.name, h.kind::text, h.status::text,
    pl.id, pl.name,
    coalesce(s.seats, pl.max_users),
    (select count(*)::int from public.people pe where pe.holding_id = h.id and pe.is_active),
    (s.id is not null and coalesce(s.seats, pl.max_users) is null),
    s.status::text, s.provider::text,
    cp.business_type, cp.city, cp.state, cp.country, cp.contact_name,
    h.created_at,
    pl.price_cents, pl.currency, pl.billing_interval
  from public.holdings h
  left join lateral (
    select * from public.subscriptions ss
    where ss.holding_id = h.id and ss.status in ('trialing','active')
    order by ss.created_at desc limit 1
  ) s on true
  left join public.plans pl on pl.id = s.plan_id
  left join public.cbx_client_profiles cp on cp.holding_id = h.id
  where app.is_cbx_staff()
  order by h.name;
$$;
revoke execute on function public.cbx_list_clients() from anon;
grant execute on function public.cbx_list_clients() to authenticated, service_role;

-- Licença da holding ativa (visível ao admin da própria holding).
create or replace function public.holding_license()
returns table(
  plan_name text, account_kind text, provider text,
  seat_limit integer, used integer, available integer,
  is_unlimited boolean, status text, current_period_end timestamptz
)
language sql stable security definer set search_path to 'public'
as $$
  with sub as (
    select s.*, p.name as plan_name, p.account_kind, p.max_users
    from public.subscriptions s
    left join public.plans p on p.id = s.plan_id
    where s.holding_id = app.current_holding_id()
      and s.status in ('trialing','active')
    order by s.created_at desc
    limit 1
  ),
  cnt as (
    select count(*)::int as used
    from public.people pe
    where pe.holding_id = app.current_holding_id() and pe.is_active
  )
  select
    sub.plan_name,
    sub.account_kind::text,
    sub.provider::text,
    coalesce(sub.seats, sub.max_users) as seat_limit,
    cnt.used,
    case when coalesce(sub.seats, sub.max_users) is null then null
         else greatest(coalesce(sub.seats, sub.max_users) - cnt.used, 0) end as available,
    coalesce(sub.seats, sub.max_users) is null as is_unlimited,
    sub.status::text,
    sub.current_period_end
  from cnt left join sub on true;
$$;

-- Visão de todas as holdings para o console /admin (só platform admin).
create or replace function public.admin_list_holdings()
returns table(
  holding_id uuid, name text, kind text, holding_status text,
  plan_id uuid, plan_name text, seat_limit integer, used integer,
  is_unlimited boolean, sub_status text, current_period_end timestamptz
)
language sql stable security definer set search_path to 'public'
as $$
  select
    h.id, h.name, h.kind::text, h.status::text,
    pl.id, pl.name,
    coalesce(s.seats, pl.max_users),
    (select count(*)::int from public.people pe where pe.holding_id = h.id and pe.is_active),
    coalesce(s.seats, pl.max_users) is null,
    s.status::text,
    s.current_period_end
  from public.holdings h
  left join lateral (
    select * from public.subscriptions ss
    where ss.holding_id = h.id and ss.status in ('trialing','active')
    order by ss.created_at desc limit 1
  ) s on true
  left join public.plans pl on pl.id = s.plan_id
  where app.is_platform_admin()
  order by h.name;
$$;

-- Planos selecionáveis no console (ativos), para o dropdown.
create or replace function public.admin_list_plans()
returns table(id uuid, name text, account_kind text, provider text, max_users integer, price_cents integer, currency text, slug text)
language sql stable security definer set search_path to 'public'
as $$
  select p.id, p.name, p.account_kind::text, p.provider::text, p.max_users, p.price_cents, p.currency, p.slug
  from public.plans p
  where app.is_platform_admin() and p.is_active
  order by (p.provider = 'manual') desc, p.account_kind, p.price_cents nulls first;
$$;

-- Atribui/atualiza a licença de uma holding (só platform admin).
-- p_seats NULL => herda max_users do plano (e VIP => ilimitado).
create or replace function public.admin_set_license(p_holding uuid, p_plan_id uuid, p_seats integer default null)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare
  existing uuid;
  prov app.billing_provider;
  is_lifetime boolean;
begin
  if not app.is_platform_admin() then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  select provider, (billing_interval = 'lifetime') into prov, is_lifetime
  from public.plans where id = p_plan_id;
  if prov is null then
    return jsonb_build_object('ok', false, 'reason', 'plan_not_found');
  end if;

  select id into existing from public.subscriptions
   where holding_id = p_holding and status in ('trialing','active')
   order by created_at desc limit 1;

  if existing is null then
    insert into public.subscriptions (holding_id, plan_id, provider, status, seats, current_period_end, canceled_at)
    values (p_holding, p_plan_id, prov, 'active', p_seats, null, null);
  else
    update public.subscriptions
       set plan_id = p_plan_id, provider = prov, status = 'active', seats = p_seats,
           current_period_end = null, canceled_at = null, updated_at = now()
     where id = existing;
  end if;

  update public.holdings set status = 'active' where id = p_holding and status <> 'active';
  return jsonb_build_object('ok', true);
end;
$$;

-- CEO v2: financeiro do mês, base de assinaturas por tipo, cancelamentos do mês
-- por tipo, região, tipo de negócio e suporte (histórico mensal).
create or replace function public.cbx_ceo_summary()
returns jsonb language sql stable security definer set search_path to 'public'
as $$
  with mes as (
    select date_trunc('month', (now() at time zone 'America/Sao_Paulo'))::date as ini
  )
  select case when not app.cbx_has_permission('CEO') then jsonb_build_object('ok', false) else
  jsonb_build_object(
    'ok', true,
    'finance', jsonb_build_object(
      'mrr_cents', coalesce((
        select jsonb_agg(jsonb_build_object('currency', x.currency, 'total_cents', x.total))
        from (select pl.currency, sum(coalesce(pl.price_cents,0)) as total
              from public.subscriptions s join public.plans pl on pl.id = s.plan_id
              where s.status in ('trialing','active') and coalesce(pl.billing_interval,'') not in ('lifetime','free')
              group by pl.currency) x), '[]'::jsonb),
      'revenue_month', coalesce((
        select jsonb_agg(jsonb_build_object('currency', x.cur, 'total', x.total))
        from (select coalesce(be.payload->'data'->'purchase'->'price'->>'currency_value','BRL') as cur,
                     sum(coalesce((be.payload->'data'->'purchase'->'price'->>'value')::numeric,0)) as total
              from public.billing_events be, mes
              where be.event_type in ('PURCHASE_APPROVED','PURCHASE_COMPLETE') and be.status='processado'
                and be.created_at >= mes.ini
              group by 1) x), '[]'::jsonb),
      'new_subs_month', (select count(*) from public.subscriptions s, mes where s.created_at >= mes.ini),
      'new_mrr_cents_month', coalesce((
        select sum(coalesce(pl.price_cents,0))
        from public.subscriptions s join public.plans pl on pl.id = s.plan_id, mes
        where s.created_at >= mes.ini and coalesce(pl.billing_interval,'') not in ('lifetime','free')), 0)
    ),
    'active', jsonb_build_object(
      'total', (select count(*) from public.subscriptions where status in ('trialing','active')),
      'corporativo', (select count(*) from public.subscriptions s join public.plans pl on pl.id=s.plan_id
                      where s.status in ('trialing','active') and pl.account_kind='corporate'),
      'familia_pago', (select count(*) from public.subscriptions s join public.plans pl on pl.id=s.plan_id
                       where s.status in ('trialing','active') and pl.account_kind='family' and pl.slug <> 'family-free'),
      'familia_free', (select count(*) from public.subscriptions s join public.plans pl on pl.id=s.plan_id
                       where s.status in ('trialing','active') and pl.slug = 'family-free')
    ),
    'canceled_month', jsonb_build_object(
      'total', (select count(*) from public.subscriptions s, mes where s.canceled_at >= mes.ini),
      'corporativo', (select count(*) from public.subscriptions s join public.plans pl on pl.id=s.plan_id, mes
                      where s.canceled_at >= mes.ini and pl.account_kind='corporate'),
      'familia_pago', (select count(*) from public.subscriptions s join public.plans pl on pl.id=s.plan_id, mes
                       where s.canceled_at >= mes.ini and pl.account_kind='family' and pl.slug <> 'family-free'),
      'familia_free', (select count(*) from public.subscriptions s join public.plans pl on pl.id=s.plan_id, mes
                       where s.canceled_at >= mes.ini and pl.slug = 'family-free')
    ),
    'by_state', coalesce((
      select jsonb_agg(jsonb_build_object('state', x.state, 'country', x.country, 'count', x.cnt) order by x.cnt desc)
      from (select cp.state, cp.country, count(*) as cnt from public.cbx_client_profiles cp
            where cp.state is not null group by cp.state, cp.country limit 30) x), '[]'::jsonb),
    'by_business_type', coalesce((
      select jsonb_agg(jsonb_build_object('type', x.bt, 'count', x.cnt) order by x.cnt desc)
      from (select cp.business_type as bt, count(*) as cnt from public.cbx_client_profiles cp
            where cp.business_type is not null group by cp.business_type limit 30) x), '[]'::jsonb),
    'support', jsonb_build_object(
      'open_total', (select count(*) from public.cbx_tickets where status <> 'resolvido'),
      'new_month', (select count(*) from public.cbx_tickets t, mes where t.created_at >= mes.ini),
      'monthly', coalesce((
        select jsonb_agg(jsonb_build_object('month', m.mon, 'abertos', m.abertos, 'concluidos', m.concluidos) order by m.mon)
        from (
          select mon, sum(abertos) as abertos, sum(concluidos) as concluidos from (
            select to_char(date_trunc('month', created_at), 'YYYY-MM') as mon, count(*) abertos, 0 concluidos
            from public.cbx_tickets where created_at > now() - interval '6 months' group by 1
            union all
            select to_char(date_trunc('month', resolved_at), 'YYYY-MM'), 0, count(*)
            from public.cbx_tickets where resolved_at is not null and resolved_at > now() - interval '6 months' group by 1
          ) u group by mon
        ) m), '[]'::jsonb),
      'by_kind', coalesce((
        select jsonb_agg(jsonb_build_object('kind', x.kind, 'count', x.cnt))
        from (select coalesce(h.kind::text,'-') as kind, count(*) as cnt
              from public.cbx_tickets t left join public.holdings h on h.id=t.holding_id group by 1) x), '[]'::jsonb)
    )
  ) end;
$$;

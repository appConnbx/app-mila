-- Dashboards do portal CBX (Financeiro e CEO). Parsing defensivo do payload
-- Hotmart 2.0 em billing_events; valores ausentes viram 0/[] sem quebrar.

create or replace function public.cbx_finance_summary()
returns jsonb language sql stable security definer set search_path to 'public'
as $$
  select case when not (app.cbx_has_permission('FINANCEIRO') or app.cbx_has_permission('CEO'))
  then jsonb_build_object('ok', false) else
  jsonb_build_object(
    'ok', true,
    'monthly_revenue', coalesce((
      select jsonb_agg(jsonb_build_object('month', m.mon, 'currency', m.cur, 'total', m.total) order by m.mon)
      from (
        select to_char(date_trunc('month', be.created_at), 'YYYY-MM') as mon,
               coalesce(be.payload->'data'->'purchase'->'price'->>'currency_value', 'BRL') as cur,
               sum(coalesce((be.payload->'data'->'purchase'->'price'->>'value')::numeric, 0)) as total
        from public.billing_events be
        where be.event_type in ('PURCHASE_APPROVED','PURCHASE_COMPLETE')
          and be.status = 'processado'
          and be.created_at > now() - interval '12 months'
        group by 1, 2
      ) m), '[]'::jsonb),
    'affiliate_split', (
      select jsonb_build_object(
        'afiliado', count(*) filter (where jsonb_array_length(coalesce(be.payload->'data'->'affiliates', '[]'::jsonb)) > 0),
        'direta',   count(*) filter (where jsonb_array_length(coalesce(be.payload->'data'->'affiliates', '[]'::jsonb)) = 0)
      )
      from public.billing_events be
      where be.event_type in ('PURCHASE_APPROVED','PURCHASE_COMPLETE')
        and be.status = 'processado'
    ),
    'active_by_plan', coalesce((
      select jsonb_agg(jsonb_build_object(
        'plan', p.plan_name, 'kind', p.kind, 'count', p.cnt,
        'price_cents', p.price_cents, 'currency', p.currency) order by p.cnt desc)
      from (
        select coalesce(pl.name, 'Sem plano') as plan_name,
               coalesce(pl.account_kind::text, '-') as kind,
               count(*) as cnt, pl.price_cents, pl.currency
        from public.subscriptions s
        left join public.plans pl on pl.id = s.plan_id
        where s.status in ('trialing','active')
        group by pl.name, pl.account_kind, pl.price_cents, pl.currency
      ) p), '[]'::jsonb),
    'mrr_cents', coalesce((
      select jsonb_agg(jsonb_build_object('currency', x.currency, 'total_cents', x.total))
      from (
        select pl.currency, sum(coalesce(pl.price_cents, 0)) as total
        from public.subscriptions s join public.plans pl on pl.id = s.plan_id
        where s.status in ('trialing','active') and pl.billing_interval <> 'lifetime'
        group by pl.currency
      ) x), '[]'::jsonb),
    'subs_flow', coalesce((
      select jsonb_agg(jsonb_build_object('month', f.mon, 'novas', f.novas, 'canceladas', f.canceladas) order by f.mon)
      from (
        select mon, sum(novas) as novas, sum(canceladas) as canceladas from (
          select to_char(date_trunc('month', created_at), 'YYYY-MM') as mon, count(*) as novas, 0 as canceladas
          from public.subscriptions where created_at > now() - interval '12 months' group by 1
          union all
          select to_char(date_trunc('month', canceled_at), 'YYYY-MM'), 0, count(*)
          from public.subscriptions where canceled_at is not null and canceled_at > now() - interval '12 months' group by 1
        ) u group by mon
      ) f), '[]'::jsonb),
    'totals', jsonb_build_object(
      'clientes', (select count(*) from public.holdings),
      'assinaturas_ativas', (select count(*) from public.subscriptions where status in ('trialing','active')),
      'past_due', (select count(*) from public.subscriptions where status = 'past_due'),
      'suspensas', (select count(*) from public.subscriptions where status = 'suspended')
    )
  ) end;
$$;

create or replace function public.cbx_ceo_summary()
returns jsonb language sql stable security definer set search_path to 'public'
as $$
  select case when not app.cbx_has_permission('CEO')
  then jsonb_build_object('ok', false) else
  jsonb_build_object(
    'ok', true,
    'clients', jsonb_build_object(
      'total', (select count(*) from public.holdings),
      'corporativo', (select count(*) from public.holdings where kind = 'corporate'),
      'familia', (select count(*) from public.holdings where kind = 'family'),
      'ativos', (select count(*) from public.holdings where status = 'active'),
      'by_state', coalesce((
        select jsonb_agg(jsonb_build_object('state', x.state, 'country', x.country, 'count', x.cnt) order by x.cnt desc)
        from (select cp.state, cp.country, count(*) as cnt
              from public.cbx_client_profiles cp where cp.state is not null
              group by cp.state, cp.country limit 20) x), '[]'::jsonb),
      'by_business_type', coalesce((
        select jsonb_agg(jsonb_build_object('type', x.bt, 'count', x.cnt) order by x.cnt desc)
        from (select cp.business_type as bt, count(*) as cnt
              from public.cbx_client_profiles cp where cp.business_type is not null
              group by cp.business_type limit 20) x), '[]'::jsonb)
    ),
    'tickets', jsonb_build_object(
      'abertos', (select count(*) from public.cbx_tickets where status <> 'resolvido'),
      'total', (select count(*) from public.cbx_tickets),
      'by_type', coalesce((
        select jsonb_agg(jsonb_build_object('type', x.type, 'count', x.cnt))
        from (select type, count(*) as cnt from public.cbx_tickets group by type) x), '[]'::jsonb),
      'by_kind', coalesce((
        select jsonb_agg(jsonb_build_object('kind', x.kind, 'count', x.cnt))
        from (select coalesce(h.kind::text, '-') as kind, count(*) as cnt
              from public.cbx_tickets t left join public.holdings h on h.id = t.holding_id
              group by 1) x), '[]'::jsonb)
    )
  ) end;
$$;

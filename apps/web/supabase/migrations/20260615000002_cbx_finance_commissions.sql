-- Base financeira: além da receita BRUTA (purchase.price.value), capta o LÍQUIDO
-- do produtor e as COMISSÕES de afiliados a partir do array data.commissions do
-- payload Hotmart 2.0 (parsing defensivo; se ausente, vira 0/[] sem quebrar).
-- Os rótulos de 'source' (PRODUCER/AFFILIATE) serão confirmados com o 1º payload
-- real; o match é case-insensitive e tolera ausência.

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
    -- Líquido do PRODUTOR (o que de fato entra), por mês, vindo de data.commissions.
    'net_revenue', coalesce((
      select jsonb_agg(jsonb_build_object('month', m.mon, 'currency', m.cur, 'total', m.total) order by m.mon)
      from (
        select to_char(date_trunc('month', be.created_at), 'YYYY-MM') as mon,
               coalesce(c->>'currency_value', 'BRL') as cur,
               sum(coalesce((c->>'value')::numeric, 0)) as total
        from public.billing_events be,
             lateral jsonb_array_elements(coalesce(be.payload->'data'->'commissions', '[]'::jsonb)) c
        where be.event_type in ('PURCHASE_APPROVED','PURCHASE_COMPLETE')
          and be.status = 'processado'
          and upper(coalesce(c->>'source', '')) = 'PRODUCER'
          and be.created_at > now() - interval '12 months'
        group by 1, 2
      ) m), '[]'::jsonb),
    -- COMISSÕES pagas a afiliados (total por moeda), vindo de data.commissions.
    'affiliate_paid', coalesce((
      select jsonb_agg(jsonb_build_object('currency', x.cur, 'total', x.total) order by x.total desc)
      from (
        select coalesce(c->>'currency_value', 'BRL') as cur,
               sum(coalesce((c->>'value')::numeric, 0)) as total
        from public.billing_events be,
             lateral jsonb_array_elements(coalesce(be.payload->'data'->'commissions', '[]'::jsonb)) c
        where be.event_type in ('PURCHASE_APPROVED','PURCHASE_COMPLETE')
          and be.status = 'processado'
          and upper(coalesce(c->>'source', '')) = 'AFFILIATE'
        group by 1
      ) x), '[]'::jsonb),
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

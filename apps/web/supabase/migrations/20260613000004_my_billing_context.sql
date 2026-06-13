-- Contexto para a página de renovação (/assinatura): tipo da conta e se a
-- licença era a família patrocinada (vinculada ao trabalho).
create or replace function public.my_billing_context()
returns jsonb language sql stable security definer set search_path to 'public', 'app'
as $$
  select jsonb_build_object(
    'kind', (select kind::text from public.holdings where id = app.current_holding_id()),
    'holding_name', (select name from public.holdings where id = app.current_holding_id()),
    'plan_slug', (
      select pl.slug from public.subscriptions s
      left join public.plans pl on pl.id = s.plan_id
      where s.holding_id = app.current_holding_id()
      order by s.created_at desc limit 1
    )
  );
$$;

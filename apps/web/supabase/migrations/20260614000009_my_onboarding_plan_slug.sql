-- my_onboarding tambem retorna o slug do plano (p/ contexto de plano gratuito no onboarding).
drop function if exists public.my_onboarding();
create or replace function public.my_onboarding()
returns table(holding_id uuid, name text, kind text, plan_slug text)
language sql stable security definer set search_path to 'public'
as $$
  select h.id, h.name, h.kind,
    (select pl.slug from public.subscriptions s
       join public.plans pl on pl.id = s.plan_id
      where s.holding_id = h.id and s.status in ('trialing','active')
      order by s.created_at desc limit 1) as plan_slug
  from public.holdings h
  join public.memberships m on m.holding_id = h.id and m.role = 'holding_admin'::app.member_role
  join public.people p on p.id = m.person_id
  where p.auth_user_id = auth.uid()
    and h.onboarding_done = false
  order by h.created_at desc
  limit 1;
$$;
revoke execute on function public.my_onboarding() from anon;
grant execute on function public.my_onboarding() to authenticated, service_role;

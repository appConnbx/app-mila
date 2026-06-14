-- Onboarding resolvido por auth.uid() (NAO depende de instancia ativa/RLS de
-- holdings, que e escopada a current_holding_id). Retorna a holding pendente
-- onde o usuario e holding_admin.
create or replace function public.my_onboarding()
returns table(holding_id uuid, name text, kind text)
language sql stable security definer set search_path to 'public'
as $$
  select h.id, h.name, h.kind
  from public.holdings h
  join public.memberships m on m.holding_id = h.id and m.role = 'holding_admin'::app.member_role
  join public.people p on p.id = m.person_id
  where p.auth_user_id = auth.uid()
    and h.onboarding_done = false
  order by h.created_at desc
  limit 1;
$$;

-- Conclui o onboarding das holdings pendentes do usuario (onde e admin).
create or replace function public.finish_my_onboarding()
returns void language sql security definer set search_path to 'public'
as $$
  update public.holdings h set onboarding_done = true
  where h.onboarding_done = false
    and exists (
      select 1 from public.memberships m
      join public.people p on p.id = m.person_id
      where m.holding_id = h.id and m.role = 'holding_admin'::app.member_role
        and p.auth_user_id = auth.uid()
    );
$$;

revoke execute on function public.my_onboarding() from anon;
revoke execute on function public.finish_my_onboarding() from anon;
grant execute on function public.my_onboarding() to authenticated, service_role;
grant execute on function public.finish_my_onboarding() to authenticated, service_role;

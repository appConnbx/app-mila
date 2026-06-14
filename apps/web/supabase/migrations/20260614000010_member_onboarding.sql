-- Onboarding de MEMBRO (qualquer usuario nao-admin), focado em uso. Flag por
-- pessoa (cada vinculo do usuario a uma instancia).
alter table public.people add column if not exists member_onboarding_done boolean not null default false;

-- Pendente? (pessoa do usuario na instancia ativa ainda nao viu o onboarding de uso)
create or replace function public.my_member_pending()
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select coalesce((select not member_onboarding_done from public.people where id = app.current_person_id()), false);
$$;

-- Conclui o onboarding de uso da pessoa atual.
create or replace function public.finish_member_onboarding()
returns void language sql security definer set search_path to 'public'
as $$
  update public.people set member_onboarding_done = true where id = app.current_person_id();
$$;

revoke execute on function public.my_member_pending() from anon;
revoke execute on function public.finish_member_onboarding() from anon;
grant execute on function public.my_member_pending() to authenticated, service_role;
grant execute on function public.finish_member_onboarding() to authenticated, service_role;

-- Membros ja existentes nao devem cair no onboarding (so novos a partir de agora).
update public.people set member_onboarding_done = true where member_onboarding_done = false;

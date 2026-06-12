-- O PostgREST só expõe RPCs do schema public; app.is_platform_admin() não era
-- alcançável pelo cliente e o guard do console nunca liberava. Wrapper público.
create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select app.is_platform_admin();
$$;

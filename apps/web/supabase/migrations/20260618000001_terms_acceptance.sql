-- Aceite dos Termos de Uso: registra data/hora por usuário (prova de aceite).
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

-- Registra o aceite dos Termos para o usuário atual (cria o profile se faltar).
create or replace function public.accept_terms()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.profiles (auth_user_id, skills, updated_at, terms_accepted_at)
  values (auth.uid(), '{}', now(), now())
  on conflict (auth_user_id) do update set terms_accepted_at = now(), updated_at = now();
$$;

grant execute on function public.accept_terms() to authenticated;

-- Corrige o trava-login: um login novo precisa reiniciar o relógio de inatividade.
-- Sem isso, touch_activity (middleware) vê o last_activity_at antigo (> 30 min) e
-- retorna 'expired' na 1a requisição autenticada, deslogando o usuário logo após o
-- login. start_session() é chamada na ação de login para zerar o relógio na entrada.
create or replace function public.start_session()
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.people set last_activity_at = now() where auth_user_id = auth.uid();
end;
$$;

grant execute on function public.start_session() to authenticated;

-- Idioma padrão por instância (junto do fuso). O agente desktop usa esta
-- configuração; em divergência entre instâncias, a corporativa prevalece.
alter table public.holdings add column if not exists language text not null default 'pt-BR';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'holdings_language_check'
  ) then
    alter table public.holdings
      add constraint holdings_language_check check (language in ('pt-BR','en','es'));
  end if;
end $$;

-- agent_holdings v3: devolve também o idioma configurado.
drop function if exists public.agent_holdings();
create or replace function public.agent_holdings()
returns table (id uuid, name text, kind text, language text)
language sql stable security definer set search_path = public
as $$
  select distinct h.id, h.name, h.kind::text, h.language
  from public.holdings h
  join public.people p on p.holding_id = h.id
  where p.auth_user_id = auth.uid()
    and p.is_active
    and h.status = 'active'
  order by h.name;
$$;

revoke all on function public.agent_holdings() from public;
grant execute on function public.agent_holdings() to authenticated;

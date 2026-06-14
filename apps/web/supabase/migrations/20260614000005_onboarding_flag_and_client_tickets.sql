-- Onboarding: flag de conclusao por holding (primeiro acesso guiado).
alter table public.holdings add column if not exists onboarding_done boolean not null default false;

-- Cliente (admin da holding) abre ticket -> alimenta a fila do CBX. SECURITY
-- DEFINER com checagem interna de holding_admin; deriva holding/cliente/autor.
create or replace function public.client_open_ticket(p_title text, p_type text, p_description text default null)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_holding uuid; v_client text; v_author text; v_id uuid;
begin
  v_holding := app.current_holding_id();
  if v_holding is null or not app.has_role('holding_admin'::app.member_role, v_holding) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if coalesce(btrim(p_title),'') = '' then
    return jsonb_build_object('ok', false, 'reason', 'campos');
  end if;
  if p_type is null or p_type not in ('incidente','solicitacao') then
    p_type := 'solicitacao';
  end if;
  select name into v_client from public.holdings where id = v_holding;
  select full_name into v_author from public.people where id = app.current_person_id();
  insert into public.cbx_tickets (holding_id, client_name, title, description, type, created_by_name)
  values (v_holding, coalesce(v_client,'—'), btrim(p_title),
          nullif(btrim(coalesce(p_description,'')),''), p_type, coalesce(v_author,'Cliente'))
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

-- Cliente lista os tickets da propria holding (acompanhamento de status).
create or replace function public.client_my_tickets()
returns table(id uuid, title text, type text, status text, created_at timestamptz, resolved_at timestamptz)
language sql stable security definer set search_path to 'public'
as $$
  select t.id, t.title, t.type, t.status, t.created_at, t.resolved_at
  from public.cbx_tickets t
  where t.holding_id = app.current_holding_id()
    and app.has_role('holding_admin'::app.member_role, app.current_holding_id())
  order by (t.status = 'resolvido'), t.created_at desc;
$$;

revoke execute on function public.client_open_ticket(text, text, text) from anon;
revoke execute on function public.client_my_tickets() from anon;
grant execute on function public.client_open_ticket(text, text, text) to authenticated, service_role;
grant execute on function public.client_my_tickets() to authenticated, service_role;

-- Bug: a thread do cliente inferia "do suporte" pelo nome do autor (!= 'Cliente'),
-- mas a resposta do cliente grava o nome real dele -> aparecia como suporte.
-- Solucao: marcar a origem explicitamente (author_kind). Tambem aplica cap de
-- tamanho em titulo/corpo (input nao confiavel).
alter table public.cbx_ticket_comments add column if not exists author_kind text not null default 'support'
  check (author_kind in ('support','client'));

create or replace function public.cbx_add_ticket_comment(p_id uuid, p_body text, p_audience text default 'internal')
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
begin
  if not app.cbx_has_permission('SUPORTE') then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if btrim(coalesce(p_body,'')) = '' then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;
  if p_audience is null or p_audience not in ('internal','client') then p_audience := 'internal'; end if;
  insert into public.cbx_ticket_comments (ticket_id, author_name, body, audience, author_kind)
  values (p_id, app.cbx_actor_name(), left(btrim(p_body), 4000), p_audience, 'support');
  update public.cbx_tickets set updated_at = now() where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.client_reply_ticket(p_id uuid, p_body text)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_holding uuid; v_author text;
begin
  v_holding := app.current_holding_id();
  if v_holding is null or not app.has_role('holding_admin'::app.member_role, v_holding) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if btrim(coalesce(p_body,'')) = '' then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  if not exists(select 1 from public.cbx_tickets where id = p_id and holding_id = v_holding) then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  select full_name into v_author from public.people where id = app.current_person_id();
  insert into public.cbx_ticket_comments (ticket_id, author_name, body, audience, author_kind)
  values (p_id, coalesce(v_author,'Cliente'), left(btrim(p_body), 4000), 'client', 'client');
  update public.cbx_tickets set updated_at = now(), client_last_seen_at = now() where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.client_ticket_thread(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_holding uuid; v_ticket public.cbx_tickets; v_msgs jsonb;
begin
  v_holding := app.current_holding_id();
  if v_holding is null or not app.has_role('holding_admin'::app.member_role, v_holding) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  select * into v_ticket from public.cbx_tickets where id = p_id and holding_id = v_holding;
  if v_ticket.id is null then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  update public.cbx_tickets set client_last_seen_at = now() where id = p_id;
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'author', c.author_name, 'body', c.body,
           'created_at', c.created_at, 'from_support', (c.author_kind = 'support'))
           order by c.created_at), '[]'::jsonb)
    into v_msgs
  from public.cbx_ticket_comments c
  where c.ticket_id = p_id and c.audience = 'client';
  return jsonb_build_object('ok', true,
    'ticket', jsonb_build_object('id', v_ticket.id, 'title', v_ticket.title, 'description', v_ticket.description,
      'status', v_ticket.status, 'created_at', v_ticket.created_at),
    'messages', v_msgs);
end;
$$;

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
  if p_type is null or p_type not in ('incidente','solicitacao') then p_type := 'solicitacao'; end if;
  select name into v_client from public.holdings where id = v_holding;
  select full_name into v_author from public.people where id = app.current_person_id();
  insert into public.cbx_tickets (holding_id, client_name, title, description, type, created_by_name)
  values (v_holding, coalesce(v_client,'—'), left(btrim(p_title), 200),
          nullif(left(btrim(coalesce(p_description,'')), 4000),''), p_type, coalesce(v_author,'Cliente'))
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

grant execute on function public.cbx_add_ticket_comment(uuid, text, text) to authenticated, service_role;
grant execute on function public.client_reply_ticket(uuid, text) to authenticated, service_role;
grant execute on function public.client_ticket_thread(uuid) to authenticated, service_role;
grant execute on function public.client_open_ticket(text, text, text) to authenticated, service_role;

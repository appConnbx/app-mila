-- Comentarios de ticket ganham AUDIENCIA: 'internal' (so staff CBX) ou 'client'
-- (interacao visivel ao cliente). Tickets ganham marca de leitura do cliente
-- (para alerta de nova mensagem do suporte).
alter table public.cbx_ticket_comments add column if not exists audience text not null default 'internal'
  check (audience in ('internal','client'));
alter table public.cbx_tickets add column if not exists client_last_seen_at timestamptz;

-- ===== STAFF: comentario com audiencia + retorno com audiencia =====
drop function if exists public.cbx_add_ticket_comment(uuid, text);
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
  insert into public.cbx_ticket_comments (ticket_id, author_name, body, audience)
  values (p_id, app.cbx_actor_name(), btrim(p_body), p_audience);
  update public.cbx_tickets set updated_at = now() where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

drop function if exists public.cbx_ticket_comments(uuid);
create or replace function public.cbx_ticket_comments(p_id uuid)
returns table(id uuid, author_name text, body text, audience text, created_at timestamptz)
language sql stable security definer set search_path to 'public'
as $$
  select c.id, c.author_name, c.body, c.audience, c.created_at
  from public.cbx_ticket_comments c
  where app.cbx_has_permission('SUPORTE') and c.ticket_id = p_id
  order by c.created_at;
$$;

-- ===== CLIENTE (holding_admin): lista, thread (marca leitura), responder, fechar =====
create or replace function public.client_list_tickets()
returns table(id uuid, title text, type text, status text, created_at timestamptz,
              updated_at timestamptz, resolved_at timestamptz, unread boolean, last_msg_at timestamptz)
language sql stable security definer set search_path to 'public'
as $$
  select t.id, t.title, t.type, t.status, t.created_at, t.updated_at, t.resolved_at,
         exists(select 1 from public.cbx_ticket_comments c
                where c.ticket_id = t.id and c.audience = 'client'
                  and c.created_at > coalesce(t.client_last_seen_at, 'epoch'::timestamptz)) as unread,
         (select max(c.created_at) from public.cbx_ticket_comments c
           where c.ticket_id = t.id and c.audience = 'client') as last_msg_at
  from public.cbx_tickets t
  where t.holding_id = app.current_holding_id()
    and app.has_role('holding_admin'::app.member_role, app.current_holding_id())
  order by (t.status = 'resolvido'), t.updated_at desc;
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
           'created_at', c.created_at, 'from_support', (c.author_name is distinct from 'Cliente'))
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
  insert into public.cbx_ticket_comments (ticket_id, author_name, body, audience)
  values (p_id, coalesce(v_author,'Cliente'), btrim(p_body), 'client');
  update public.cbx_tickets set updated_at = now(), client_last_seen_at = now() where id = p_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.client_close_ticket(p_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare v_holding uuid;
begin
  v_holding := app.current_holding_id();
  if v_holding is null or not app.has_role('holding_admin'::app.member_role, v_holding) then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  update public.cbx_tickets set status = 'resolvido', resolved_at = now(), updated_at = now()
   where id = p_id and holding_id = v_holding;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.cbx_add_ticket_comment(uuid, text, text) from anon;
revoke execute on function public.cbx_ticket_comments(uuid) from anon;
revoke execute on function public.client_list_tickets() from anon;
revoke execute on function public.client_ticket_thread(uuid) from anon;
revoke execute on function public.client_reply_ticket(uuid, text) from anon;
revoke execute on function public.client_close_ticket(uuid) from anon;
grant execute on function public.cbx_add_ticket_comment(uuid, text, text) to authenticated, service_role;
grant execute on function public.cbx_ticket_comments(uuid) to authenticated, service_role;
grant execute on function public.client_list_tickets() to authenticated, service_role;
grant execute on function public.client_ticket_thread(uuid) to authenticated, service_role;
grant execute on function public.client_reply_ticket(uuid, text) to authenticated, service_role;
grant execute on function public.client_close_ticket(uuid) to authenticated, service_role;

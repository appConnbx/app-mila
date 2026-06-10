-- ============================================================
-- Reestruturação de Eventos: contêiner com admin + participantes + atividades
-- ============================================================

-- 1) Helper: pode adicionar atividade ao evento (evento aberto + dono/participante)
create or replace function app.can_add_event_demand(_event uuid)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.events e
    where e.id = _event
      and e.holding_id = app.current_holding_id()
      and e.status = 'aberto'
      and (
        e.owner_id = app.current_person_id()
        or exists (select 1 from public.event_participants ep
                   where ep.event_id = e.id and ep.person_id = app.current_person_id())
      )
  );
$$;

-- 2) can_see_demand: membros do evento enxergam as atividades do evento
create or replace function app.can_see_demand(_demand uuid)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.demands d
    where d.id = _demand
      and d.holding_id = app.current_holding_id()
      and (
        d.responsible_id = app.current_person_id()
        or d.origin_id = app.current_person_id()
        or (d.event_id is not null and app.can_see_event(d.event_id))
        or (d.visibility = 'public' and (
              exists (select 1 from public.holdings h where h.id = d.holding_id and h.kind = 'family')
              or app.shares_team(app.current_person_id(), d.origin_id)
              or app.can_oversee(d.origin_id)
        ))
      )
  );
$$;

-- 3) demands_select: adiciona ramo de visibilidade por evento
drop policy if exists demands_select on public.demands;
create policy demands_select on public.demands for select
using (
  holding_id = app.current_holding_id()
  and (
    responsible_id = app.current_person_id()
    or origin_id = app.current_person_id()
    or (event_id is not null and app.can_see_event(event_id))
    or (visibility = 'public' and (
          exists (select 1 from public.holdings h where h.id = demands.holding_id and h.kind = 'family')
          or app.shares_team(app.current_person_id(), origin_id)
          or app.can_oversee(origin_id)
    ))
  )
);

-- 4) demands_insert: ramo para atividades de evento (dispensa can_create_demands + can_delegate)
drop policy if exists demands_insert on public.demands;
create policy demands_insert on public.demands for insert
with check (
  (
    holding_id = app.current_holding_id()
    and origin_id = app.current_person_id()
    and app.can_create_demands()
    and (
      responsible_id = app.current_person_id()
      or (
        (select people.can_delegate from public.people where people.id = app.current_person_id())
        and exists (select 1 from public.people p
                    where p.id = demands.responsible_id and p.holding_id = app.current_holding_id())
      )
    )
  )
  or (
    event_id is not null
    and holding_id = app.current_holding_id()
    and origin_id = app.current_person_id()
    and app.can_add_event_demand(event_id)
    and exists (
      select 1 from public.events e
      where e.id = demands.event_id
        and (
          e.owner_id = demands.responsible_id
          or exists (select 1 from public.event_participants ep
                     where ep.event_id = e.id and ep.person_id = demands.responsible_id)
        )
    )
  )
);

-- 5) event_participants_write: somente dono do evento (ou overseer) gerencia participantes
drop policy if exists event_participants_write on public.event_participants;
create policy event_participants_write on public.event_participants for all
using (
  holding_id = app.current_holding_id()
  and exists (
    select 1 from public.events e
    where e.id = event_participants.event_id
      and (e.owner_id = app.current_person_id() or app.can_oversee(e.owner_id))
  )
)
with check (
  holding_id = app.current_holding_id()
  and exists (
    select 1 from public.events e
    where e.id = event_participants.event_id
      and (e.owner_id = app.current_person_id() or app.can_oversee(e.owner_id))
  )
);

-- 6) Limpa resíduo do modelo antigo de sessão ativa (mantém coluna e trigger)
update public.people set active_event_id = null where active_event_id is not null;

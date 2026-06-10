-- ============================================================
-- Fix: criacao de evento falhava silenciosamente.
-- events_select usava app.can_see_event(id), que RE-CONSULTA public.events.
-- Em INSERT ... RETURNING (usado pelo .select().single() do supabase-js) a
-- linha recem-inserida ainda nao e visivel nesse subselect -> o RETURNING
-- violava o RLS e abortava o insert inteiro. Nenhum evento era criado.
--
-- Correcao: events_select le as colunas da PROPRIA linha (owner_id/holding_id)
-- e usa um helper SECURITY DEFINER para a checagem de participante, que
-- consulta apenas event_participants (ignora RLS, sem recursao) e NAO toca em
-- public.events (sem o problema de snapshot no RETURNING).
-- ============================================================

create or replace function app.is_event_participant(_event uuid)
returns boolean
language sql stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.event_participants ep
    where ep.event_id = _event and ep.person_id = app.current_person_id()
  );
$$;

drop policy if exists events_select on public.events;
create policy events_select on public.events for select
using (
  holding_id = app.current_holding_id()
  and (
    owner_id = app.current_person_id()
    or app.can_oversee(owner_id)
    or app.is_event_participant(id)
  )
);

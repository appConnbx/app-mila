-- Admin da holding pode excluir qualquer demanda da holding (alem do criador).
-- (events_delete ja permite ao admin via app.can_oversee(owner_id).)
drop policy if exists demands_delete on public.demands;
create policy demands_delete on public.demands for delete
using (
  holding_id = app.current_holding_id()
  and (
    origin_id = app.current_person_id()
    or app.is_holding_admin()
  )
);

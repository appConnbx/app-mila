-- ============================================================================
-- APP MILA — Migration 0007: Hardening de segurança
-- Fixa o search_path das duas funções que ficaram com search_path mutável
-- (apontado pelo linter de segurança do Supabase). Demais funções já fixam.
-- ============================================================================

alter function app.set_updated_at()      set search_path = public;
alter function app.requested_holding_id() set search_path = public;

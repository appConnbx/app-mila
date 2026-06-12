-- Logo (foto de perfil) para a instância (holding) e para organizações.
alter table public.holdings add column if not exists logo_url text;
alter table public.organizations add column if not exists logo_url text;

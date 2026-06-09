-- ============================================================================
-- APP MILA — Migration 0001: Schema base
-- Tabelas, enums, chaves estrangeiras e índices.
-- Hierarquia: Holding > Organização > Área > Equipe > Pessoa
-- Tenant (isolamento SaaS) = holding_id em todas as tabelas.
-- ============================================================================

create extension if not exists pgcrypto;     -- gen_random_uuid()

-- Schema dedicado para funções auxiliares e tipos do domínio.
create schema if not exists app;

-- ----------------------------------------------------------------------------
-- ENUMS (listas fixas de valores)
-- ----------------------------------------------------------------------------
create type app.member_role     as enum ('member','team_admin','area_admin','org_admin','holding_admin');
create type app.scope_level      as enum ('holding','organization','area','team');
create type app.demand_status    as enum ('nova','trabalhando','finalizada');
create type app.demand_priority  as enum ('baixa','media','alta');
create type app.demand_channel   as enum ('web','mobile','whatsapp','api');
create type app.event_type       as enum ('reuniao','ata','comite','follow_up','alinhamento','plano_acao','diagnostico','outro');
create type app.event_status     as enum ('aberto','fechado');
create type app.whatsapp_status  as enum ('recebida','aguardando_confirmacao','criada','ignorada');

-- ----------------------------------------------------------------------------
-- 1. HOLDINGS  (grupo de empresas — a conta-raiz / tenant do SaaS)
-- ----------------------------------------------------------------------------
create table public.holdings (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. ORGANIZATIONS  (empresas dentro do grupo)
-- ----------------------------------------------------------------------------
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  holding_id  uuid not null references public.holdings(id) on delete cascade,
  name        text not null,
  slug        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (holding_id, slug)
);

-- ----------------------------------------------------------------------------
-- 3. AREAS  (divisões da organização)
-- ----------------------------------------------------------------------------
create table public.areas (
  id               uuid primary key default gen_random_uuid(),
  holding_id       uuid not null references public.holdings(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. TEAMS  (equipes dentro de uma área)
-- ----------------------------------------------------------------------------
create table public.teams (
  id               uuid primary key default gen_random_uuid(),
  holding_id       uuid not null references public.holdings(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  area_id          uuid not null references public.areas(id) on delete cascade,
  name             text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. PEOPLE  (usuários do sistema)
--    active_event_id = sessão de captura aberta (vazio = demandas avulsas).
--    A FK para events é adicionada após a tabela events (dependência circular).
-- ----------------------------------------------------------------------------
create table public.people (
  id               uuid primary key default gen_random_uuid(),
  holding_id       uuid not null references public.holdings(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  auth_user_id     uuid unique references auth.users(id) on delete set null,
  full_name        text not null,
  role_title       text,
  can_delegate     boolean not null default false,
  whatsapp_phone   text unique,
  active_event_id  uuid,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. PERSON_ALIASES  (apelidos — usados p/ reconhecer pessoas no WhatsApp)
-- ----------------------------------------------------------------------------
create table public.person_aliases (
  id          uuid primary key default gen_random_uuid(),
  holding_id  uuid not null references public.holdings(id) on delete cascade,
  person_id   uuid not null references public.people(id) on delete cascade,
  alias       text not null,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. TEAM_MEMBERS  (Pessoa N:N Equipe — pessoa pode estar em várias equipes)
-- ----------------------------------------------------------------------------
create table public.team_members (
  id          uuid primary key default gen_random_uuid(),
  holding_id  uuid not null references public.holdings(id) on delete cascade,
  person_id   uuid not null references public.people(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (person_id, team_id)
);

-- ----------------------------------------------------------------------------
-- 8. MEMBERSHIPS  (papéis por escopo — vários admins por nível são possíveis)
--    scope_id é polimórfico: aponta para holding/org/área/equipe conforme
--    scope_level. Validado por trigger (não há FK por ser polimórfico).
-- ----------------------------------------------------------------------------
create table public.memberships (
  id           uuid primary key default gen_random_uuid(),
  holding_id   uuid not null references public.holdings(id) on delete cascade,
  person_id    uuid not null references public.people(id) on delete cascade,
  role         app.member_role not null,
  scope_level  app.scope_level not null,
  scope_id     uuid not null,
  created_at   timestamptz not null default now(),
  unique (person_id, role, scope_level, scope_id)
);

-- ----------------------------------------------------------------------------
-- 9. EVENTS  (agrupadores de demandas — sessões dinâmicas abrir/fechar)
-- ----------------------------------------------------------------------------
create table public.events (
  id               uuid primary key default gen_random_uuid(),
  holding_id       uuid not null references public.holdings(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  owner_id         uuid not null references public.people(id) on delete restrict,
  name             text not null,
  type             app.event_type not null default 'outro',
  status           app.event_status not null default 'aberto',
  event_date       date,
  opened_at        timestamptz not null default now(),
  closed_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Resolve a dependência circular people <-> events.
alter table public.people
  add constraint people_active_event_fk
  foreign key (active_event_id) references public.events(id) on delete set null;

-- ----------------------------------------------------------------------------
-- 10. EVENT_PARTICIPANTS  (Evento N:N Pessoa)
-- ----------------------------------------------------------------------------
create table public.event_participants (
  id          uuid primary key default gen_random_uuid(),
  holding_id  uuid not null references public.holdings(id) on delete cascade,
  event_id    uuid not null references public.events(id) on delete cascade,
  person_id   uuid not null references public.people(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (event_id, person_id)
);

-- ----------------------------------------------------------------------------
-- 11. DEMANDS  (a unidade de trabalho)
--     holding_id/organization_id derivados do responsável (trigger).
--     area_id/team_id são tags opcionais; a visibilidade por nível usa o
--     vínculo do responsável, não estes campos (ver migration de RLS).
-- ----------------------------------------------------------------------------
create table public.demands (
  id               uuid primary key default gen_random_uuid(),
  holding_id       uuid not null references public.holdings(id) on delete cascade,
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  area_id          uuid references public.areas(id) on delete set null,
  team_id          uuid references public.teams(id) on delete set null,
  title            text not null,
  description      text,
  responsible_id   uuid not null references public.people(id) on delete restrict,
  origin_id        uuid not null references public.people(id) on delete restrict,
  event_id         uuid references public.events(id) on delete set null,
  channel          app.demand_channel not null default 'web',
  priority         app.demand_priority not null default 'media',
  status           app.demand_status not null default 'nova',
  due_date         date,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 12. DEMAND_OBSERVATIONS  (observações de atividade)
-- ----------------------------------------------------------------------------
create table public.demand_observations (
  id          uuid primary key default gen_random_uuid(),
  holding_id  uuid not null references public.holdings(id) on delete cascade,
  demand_id   uuid not null references public.demands(id) on delete cascade,
  author_id   uuid not null references public.people(id) on delete restrict,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 13. DEMAND_HISTORY  (auditoria automática de mudanças)
-- ----------------------------------------------------------------------------
create table public.demand_history (
  id             uuid primary key default gen_random_uuid(),
  holding_id     uuid not null references public.holdings(id) on delete cascade,
  demand_id      uuid not null references public.demands(id) on delete cascade,
  changed_by     uuid references public.people(id) on delete set null,
  field_changed  text not null,
  old_value      text,
  new_value      text,
  created_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 14. WHATSAPP_MESSAGES  (log de ingestão por WhatsApp)
-- ----------------------------------------------------------------------------
create table public.whatsapp_messages (
  id                 uuid primary key default gen_random_uuid(),
  holding_id         uuid references public.holdings(id) on delete cascade,
  from_phone         text not null,
  person_id          uuid references public.people(id) on delete set null,
  raw_text           text,
  parsed_data        jsonb,
  status             app.whatsapp_status not null default 'recebida',
  created_demand_id  uuid references public.demands(id) on delete set null,
  created_event_id   uuid references public.events(id) on delete set null,
  created_at         timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ÍNDICES (consultas e RLS rápidos)
-- ----------------------------------------------------------------------------
create index idx_organizations_holding   on public.organizations (holding_id);
create index idx_areas_org                on public.areas (organization_id);
create index idx_teams_area               on public.teams (area_id);
create index idx_people_holding           on public.people (holding_id);
create index idx_people_org               on public.people (organization_id);
create index idx_people_auth              on public.people (auth_user_id);
create index idx_aliases_person           on public.person_aliases (person_id);
create index idx_team_members_person      on public.team_members (person_id);
create index idx_team_members_team        on public.team_members (team_id);
create index idx_memberships_person       on public.memberships (person_id);
create index idx_memberships_scope        on public.memberships (scope_id);
create index idx_events_owner             on public.events (owner_id);
create index idx_events_status            on public.events (status);
create index idx_event_participants_person on public.event_participants (person_id);
create index idx_demands_responsible      on public.demands (responsible_id);
create index idx_demands_origin           on public.demands (origin_id);
create index idx_demands_event            on public.demands (event_id);
create index idx_demands_status           on public.demands (status);
create index idx_demands_due              on public.demands (due_date);
create index idx_demands_holding          on public.demands (holding_id);
create index idx_observations_demand      on public.demand_observations (demand_id);
create index idx_history_demand           on public.demand_history (demand_id);
create index idx_whatsapp_phone           on public.whatsapp_messages (from_phone);

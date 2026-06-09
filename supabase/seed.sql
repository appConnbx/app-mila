-- ============================================================================
-- APP MILA — Seed de desenvolvimento (dados de exemplo)
-- Roda automaticamente em `supabase db reset`. NÃO usar em produção.
-- Cria o Grupo Ribeiro Caram com 1 organização, áreas, equipes, pessoas,
-- papéis, 1 evento (follow-up) e demandas vinculadas.
-- As pessoas ficam sem auth_user_id (login) — basta para visualizar o modelo.
-- ============================================================================

do $$
declare
  v_holding uuid;
  v_org     uuid;
  v_area_ti uuid;
  v_team_ti uuid;
  v_olivaldo uuid;
  v_gabriel  uuid;
  v_rebeca   uuid;
  v_anderson uuid;
  v_event    uuid;
  v_fam_hold uuid;
  v_fam_org  uuid;
begin
  -- Holding e organização (vertical CORPORATIVA — kind = corporate por padrão)
  insert into public.holdings (name, slug) values ('Grupo Ribeiro Caram', 'grupo-ribeiro-caram')
    returning id into v_holding;
  insert into public.organizations (holding_id, name, slug) values (v_holding, 'Ribeiro Caram', 'ribeiro-caram')
    returning id into v_org;

  -- Área e equipe
  insert into public.areas (holding_id, organization_id, name) values (v_holding, v_org, 'Diretoria de Gestão')
    returning id into v_area_ti;
  insert into public.teams (holding_id, organization_id, area_id, name) values (v_holding, v_org, v_area_ti, 'TI')
    returning id into v_team_ti;

  -- Pessoas
  insert into public.people (holding_id, organization_id, full_name, role_title, can_delegate)
    values (v_holding, v_org, 'Olivaldo Filho', 'Coordenador de TI', true) returning id into v_olivaldo;
  insert into public.people (holding_id, organization_id, full_name, role_title)
    values (v_holding, v_org, 'Gabriel', 'Analista de Suporte') returning id into v_gabriel;
  insert into public.people (holding_id, organization_id, full_name, role_title)
    values (v_holding, v_org, 'Rebeca', 'Analista de Infra') returning id into v_rebeca;
  insert into public.people (holding_id, organization_id, full_name, role_title)
    values (v_holding, v_org, 'Anderson', 'Analista de Redes') returning id into v_anderson;

  -- Vínculo das pessoas à equipe de TI
  insert into public.team_members (holding_id, person_id, team_id) values
    (v_holding, v_olivaldo, v_team_ti),
    (v_holding, v_gabriel,  v_team_ti),
    (v_holding, v_rebeca,   v_team_ti),
    (v_holding, v_anderson, v_team_ti);

  -- Olivaldo é admin da equipe de TI
  insert into public.memberships (holding_id, person_id, role, scope_level, scope_id)
    values (v_holding, v_olivaldo, 'team_admin', 'team', v_team_ti);

  -- Apelidos (para reconhecimento no WhatsApp)
  insert into public.person_aliases (holding_id, person_id, alias) values
    (v_holding, v_gabriel, 'Gabi'),
    (v_holding, v_olivaldo, 'Oli');

  -- Evento (follow-up) FECHADO, conduzido pelo Olivaldo
  insert into public.events (holding_id, organization_id, owner_id, name, type, status, event_date, closed_at)
    values (v_holding, v_org, v_olivaldo, 'Reunião de Follow-up TI', 'follow_up', 'fechado', current_date, now())
    returning id into v_event;
  insert into public.event_participants (holding_id, event_id, person_id) values
    (v_holding, v_event, v_olivaldo),
    (v_holding, v_event, v_gabriel),
    (v_holding, v_event, v_rebeca),
    (v_holding, v_event, v_anderson);

  -- Demandas do evento (origem = Olivaldo)
  insert into public.demands (holding_id, organization_id, title, responsible_id, origin_id, event_id, priority, status, channel)
    values
    (v_holding, v_org, 'Validar chamados pendentes', v_gabriel,  v_olivaldo, v_event, 'alta',  'trabalhando', 'web'),
    (v_holding, v_org, 'Revisar controle de notebooks', v_rebeca, v_olivaldo, v_event, 'media', 'nova', 'web'),
    (v_holding, v_org, 'Verificar instabilidade de rede', v_anderson, v_olivaldo, v_event, 'alta', 'nova', 'web'),
    (v_holding, v_org, 'Preparar resumo para diretoria', v_olivaldo, v_olivaldo, v_event, 'media', 'finalizada', 'web');

  -- Demanda avulsa (sem evento)
  insert into public.demands (holding_id, organization_id, title, responsible_id, origin_id, priority, status, channel, due_date)
    values (v_holding, v_org, 'Atualizar inventário de licenças', v_olivaldo, v_olivaldo, 'baixa', 'nova', 'web', current_date + 7);

  -- Assinatura corporativa (Corporativo 10) para a holding acima
  insert into public.subscriptions (holding_id, plan_id, provider, status, seats, buyer_email)
    select v_holding, p.id, 'manual', 'active', 10, 'contato@ribeirocaram.com.br'
    from public.plans p where p.slug = 'corp-10';

  -- Vertical FAMILIAR — uma família é uma conta kind = family
  insert into public.holdings (name, slug, kind) values ('Família Olivaldo', 'familia-olivaldo', 'family')
    returning id into v_fam_hold;
  insert into public.organizations (holding_id, name, slug) values (v_fam_hold, 'Casa', 'casa')
    returning id into v_fam_org;
  insert into public.people (holding_id, organization_id, full_name, role_title, can_delegate)
    values (v_fam_hold, v_fam_org, 'Olivaldo (pessoal)', 'Responsável', true);
  insert into public.people (holding_id, organization_id, full_name)
    values (v_fam_hold, v_fam_org, 'Cônjuge');
  insert into public.subscriptions (holding_id, plan_id, provider, status, seats, buyer_email)
    select v_fam_hold, p.id, 'manual', 'active', 2, 'eu@olivaldo.com.br'
    from public.plans p where p.slug = 'familia-2';
end $$;


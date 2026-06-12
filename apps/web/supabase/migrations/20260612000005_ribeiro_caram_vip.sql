-- Aplica VIP CONNBX (vitalício, ilimitado) ao Grupo Ribeiro Caram.
-- seats NULL => account_seat_limit retorna NULL => sem teto de usuários.
update public.subscriptions s
set plan_id = (select id from public.plans where slug = 'vip-connbx-corporate'),
    provider = 'manual',
    status = 'active',
    seats = null,
    current_period_end = null,
    canceled_at = null,
    updated_at = now()
where s.holding_id = 'ae99df3f-cf24-4493-b5b7-11138e12c659'
  and s.status in ('trialing','active');

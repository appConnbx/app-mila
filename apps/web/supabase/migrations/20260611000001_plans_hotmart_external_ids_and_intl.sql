-- Vincula os planos ativos aos produtos da Hotmart (BR + International).
-- Produto Brasil (BRL): ID 7914296, hotlink P106262837P
-- Produto International (USD): ID 7915380, hotlink Y106267582L
-- O resolver do webhook (resolvePlanId) casa external_product_id + external_offer_code.

-- ----- Produto Brasil: preenche product id, oferta e link de checkout -----
update plans set external_product_id='7914296', external_offer_code='hcxkobrb',
  features = features || jsonb_build_object('checkout_url','https://pay.hotmart.com/P106262837P?off=hcxkobrb'),
  updated_at=now() where slug='corp-starter-20';
update plans set external_product_id='7914296', external_offer_code='7d5lrof8',
  features = features || jsonb_build_object('checkout_url','https://pay.hotmart.com/P106262837P?off=7d5lrof8'),
  updated_at=now() where slug='corp-growth-50';
update plans set external_product_id='7914296', external_offer_code='u7x98fyz',
  features = features || jsonb_build_object('checkout_url','https://pay.hotmart.com/P106262837P?off=u7x98fyz'),
  updated_at=now() where slug='corp-scale-200';
update plans set external_product_id='7914296', external_offer_code='9gacabk6',
  features = features || jsonb_build_object('checkout_url','https://pay.hotmart.com/P106262837P?off=9gacabk6'),
  updated_at=now() where slug='corp-enterprise';
update plans set external_product_id='7914296', external_offer_code='f7nrog01',
  features = features || jsonb_build_object('checkout_url','https://pay.hotmart.com/P106262837P?off=f7nrog01'),
  updated_at=now() where slug='family-5';
update plans set external_product_id='7914296', external_offer_code='d3c9cwha',
  features = features || jsonb_build_object('checkout_url','https://pay.hotmart.com/P106262837P?off=d3c9cwha'),
  updated_at=now() where slug='family-plus-10';

-- ----- Produto International: planos em USD (espelham os BRL) -----
insert into plans (name, slug, description, provider, external_product_id, external_offer_code, price_cents, currency, billing_interval, account_kind, included_users, max_users, features, is_active) values
('Starter','corp-starter-20-intl','Corporate plan — up to 20 users','hotmart','7915380','gwlaaeei',8000,'USD','monthly','corporate',20,20, jsonb_build_object('checkout_url','https://pay.hotmart.com/Y106267582L?off=gwlaaeei'), true),
('Growth','corp-growth-50-intl','Corporate plan — up to 50 users','hotmart','7915380','qqkl7a6p',15000,'USD','monthly','corporate',50,50, jsonb_build_object('checkout_url','https://pay.hotmart.com/Y106267582L?off=qqkl7a6p'), true),
('Scale','corp-scale-200-intl','Corporate plan — up to 200 users','hotmart','7915380','v7x1xwst',40000,'USD','monthly','corporate',200,200, jsonb_build_object('checkout_url','https://pay.hotmart.com/Y106267582L?off=v7x1xwst'), true),
('Enterprise','corp-enterprise-intl','Corporate plan — unlimited users','hotmart','7915380','g901biby',50000,'USD','monthly','corporate',null,null, jsonb_build_object('checkout_url','https://pay.hotmart.com/Y106267582L?off=g901biby'), true),
('Family','family-5-intl','Family plan — up to 5 users','hotmart','7915380','gmafnne4',900,'USD','monthly','family',5,5, jsonb_build_object('checkout_url','https://pay.hotmart.com/Y106267582L?off=gmafnne4'), true),
('Family Plus','family-plus-10-intl','Family plan — up to 10 users','hotmart','7915380','e4qsc1yt',1300,'USD','monthly','family',10,10, jsonb_build_object('checkout_url','https://pay.hotmart.com/Y106267582L?off=e4qsc1yt'), true);

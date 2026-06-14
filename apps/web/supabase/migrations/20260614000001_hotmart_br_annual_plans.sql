-- Planos BR (produto Hotmart 7914296) recriados como ANUAL cobrado em 12x (jun/2026).
-- Atualiza os códigos de oferta (off=), checkout_url, preço (total anual em centavos) e o
-- intervalo de cobrança. As ofertas MENSAIS antigas ficaram na Hotmart só para assinantes;
-- aqui o mapeamento passa a apontar para as ofertas anuais novas, senão resolvePlanId
-- (webhook) não casa o off= e cairia no fallback do primeiro plano.
--
-- Corp: preço = total anual (12x sem juros). Família: total anual.
-- Starter R$3.564 (12x 297) · Growth R$5.964 (12x 497) · Scale R$8.364 (12x 697)
-- Enterprise R$13.404 (12x 1.117) · Family R$97 (12x 8,08) · Family Plus R$127 (12x 10,58)

update plans set
  external_offer_code = 'wyitwc3d',
  price_cents = 356400,
  billing_interval = 'annual',
  features = features || jsonb_build_object('checkout_url', 'https://pay.hotmart.com/P106262837P?off=wyitwc3d'),
  updated_at = now()
where slug = 'corp-starter-20' and external_product_id = '7914296';

update plans set
  external_offer_code = '2kxlbff2',
  price_cents = 596400,
  billing_interval = 'annual',
  features = features || jsonb_build_object('checkout_url', 'https://pay.hotmart.com/P106262837P?off=2kxlbff2'),
  updated_at = now()
where slug = 'corp-growth-50' and external_product_id = '7914296';

update plans set
  external_offer_code = 'abpzxjap',
  price_cents = 836400,
  billing_interval = 'annual',
  features = features || jsonb_build_object('checkout_url', 'https://pay.hotmart.com/P106262837P?off=abpzxjap'),
  updated_at = now()
where slug = 'corp-scale-200' and external_product_id = '7914296';

update plans set
  external_offer_code = 'yl7fpa6u',
  price_cents = 1340400,
  billing_interval = 'annual',
  features = features || jsonb_build_object('checkout_url', 'https://pay.hotmart.com/P106262837P?off=yl7fpa6u'),
  updated_at = now()
where slug = 'corp-enterprise' and external_product_id = '7914296';

update plans set
  external_offer_code = 'i67ovflk',
  price_cents = 9700,
  billing_interval = 'annual',
  features = features || jsonb_build_object('checkout_url', 'https://pay.hotmart.com/P106262837P?off=i67ovflk'),
  updated_at = now()
where slug = 'family-5' and external_product_id = '7914296';

update plans set
  external_offer_code = 'tfkn6adh',
  price_cents = 12700,
  billing_interval = 'annual',
  features = features || jsonb_build_object('checkout_url', 'https://pay.hotmart.com/P106262837P?off=tfkn6adh'),
  updated_at = now()
where slug = 'family-plus-10' and external_product_id = '7914296';

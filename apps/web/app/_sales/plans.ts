import type { SalesPlan } from './SalesPage'

/* Fonte única de preços + checkout das páginas de vendas.
   BR  = produto Brasil (P106262837P), anual cobrado em 12x (corp) / total anual (família).
   INTL = produto International (Y106267582L), assinatura mensal em US$.
   TODO(hotmart-br): ao recriar as ofertas BR como ANUAL/12x, trocar os off= BR pelos novos códigos. */
const urlBR = (off: string) => `https://pay.hotmart.com/P106262837P?off=${off}`

const BR_CORP = [
  { name: 'Starter', off: 'hcxkobrb', parcela: '297', total: '3.564' },
  { name: 'Growth', off: '7d5lrof8', parcela: '497', total: '5.964' },
  { name: 'Scale', off: 'u7x98fyz', parcela: '697', total: '8.364' },
  { name: 'Enterprise', off: '9gacabk6', parcela: '1.117', total: '13.404' },
]
const INTL_CORP = [
  { name: 'Starter', plan: 'starter', usd: '87' },
  { name: 'Growth', plan: 'growth', usd: '167' },
  { name: 'Scale', plan: 'scale', usd: '337' },
  { name: 'Enterprise', plan: 'enterprise', usd: '667' },
]
const BR_FAM = [
  { name: 'Family', off: 'f7nrog01', annual: '97', parcela: '8,08' },
  { name: 'Family Plus', off: 'd3c9cwha', annual: '127', parcela: '10,58' },
]
const INTL_FAM = [
  { name: 'Family', plan: 'family', usd: '13' },
  { name: 'Family Plus', plan: 'family_plus', usd: '17' },
]

// Assinatura internacional: passa pelo gate /subscribe (valida e-mail) antes do Stripe.
// O idioma é derivado da página de origem (next).
const stripeHref = (plan: string, next: string) => {
  const lang = next.startsWith('/en') ? 'en' : next.startsWith('/es') ? 'es' : 'pt-BR'
  return `/subscribe?plan=${plan}&next=${encodeURIComponent(next)}&lang=${lang}`
}

const CORP_FEATURED = 2 // Scale
const FAM_FEATURED = 1 // Family Plus

type CorpLabels = { users: string[]; cta: string; popular: string; unit?: string; next?: string }
type FamLabels = { users: string[]; cta: string; popular: string; unit?: string; next?: string }

export function corpPlansBR(l: CorpLabels): SalesPlan[] {
  return BR_CORP.map((p, i) => ({
    name: p.name,
    users: l.users[i],
    priceMain: `R$${p.parcela}`,
    priceUnit: '',
    priceSub: `12x · ou R$${p.total} à vista (plano anual)`,
    href: urlBR(p.off),
    cta: l.cta,
    featured: i === CORP_FEATURED,
    popular: l.popular,
  }))
}

export function corpPlansINTL(l: CorpLabels): SalesPlan[] {
  return INTL_CORP.map((p, i) => ({
    name: p.name,
    users: l.users[i],
    priceMain: `US$${p.usd}`,
    priceUnit: l.unit ?? '/month',
    href: stripeHref(p.plan, l.next ?? '/'),
    cta: l.cta,
    featured: i === CORP_FEATURED,
    popular: l.popular,
  }))
}

export function famPlansBR(l: FamLabels): SalesPlan[] {
  return BR_FAM.map((p, i) => ({
    name: p.name,
    users: l.users[i],
    priceMain: `R$${p.annual}`,
    priceUnit: '/ano',
    priceSub: `ou 12x de R$${p.parcela}`,
    href: urlBR(p.off),
    cta: l.cta,
    featured: i === FAM_FEATURED,
    popular: l.popular,
  }))
}

export function famPlansINTL(l: FamLabels): SalesPlan[] {
  return INTL_FAM.map((p, i) => ({
    name: p.name,
    users: l.users[i],
    priceMain: `US$${p.usd}`,
    priceUnit: l.unit ?? '/month',
    href: stripeHref(p.plan, l.next ?? '/'),
    cta: l.cta,
    featured: i === FAM_FEATURED,
    popular: l.popular,
  }))
}

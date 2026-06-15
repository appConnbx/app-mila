# Medição & Conversão (pixels) — guia de ativação

A fundação já está no código e **inerte**: enquanto não houver ID configurado,
nada carrega, o banner de consentimento não aparece e o site fica idêntico.
Para ativar, basta definir os IDs como **variáveis de ambiente na Vercel** e
fazer redeploy.

## 1. Variáveis de ambiente (Vercel → Settings → Environment Variables)

Defina só as que você for usar (qualquer uma já ativa a camada):

| Variável | O que é | Formato |
|---|---|---|
| `NEXT_PUBLIC_GA4_ID` | Google Analytics 4 | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Google Ads (conversões) | `AW-XXXXXXXXX` |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta (Facebook/Instagram) Pixel | `1234567890` |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | TikTok Pixel | `CXXXXXXXXXXXXXXXXX` |

> São `NEXT_PUBLIC_*` (públicas, embutidas no build) — pixels são client-side por natureza. Após definir, **redeploy** para valer.

## 2. Como funciona

- **Onde mede:** só páginas públicas de marketing (`/`, `/en`, `/es`, `/br-*`, `/en-*`, `/es-*`, `/affiliates`, `/start`, `/welcome`). **Nunca** o app autenticado nem o `/cbx`.
- **Consentimento (LGPD/GDPR):** banner "Aceitar/Recusar" aparece só quando há pixel configurado. **Recusar = não rastreia** (padrão privacy). Decisão guardada no cookie `mila_consent` por 180 dias.
- **CSP:** já liberada para googletagmanager, google-analytics, facebook e tiktok (em `next.config.mjs`).
- **PageView** dispara automático. Para conversões, use o helper `track()`:
  ```ts
  import { track } from '@/lib/analytics'
  track('begin_checkout', { plan: 'scale' })
  track('Lead')
  track('Purchase', { value: 297, currency: 'BRL' })
  ```

## 3. Padrão de UTM (campanhas → LPs)

`?utm_source=<google|meta|tiktok>&utm_medium=<cpc|paid_social>&utm_campaign=<nome>&utm_content=<criativo>&utm_term=<palavra-chave>`

Exemplos:
- `…/br-business?utm_source=google&utm_medium=cpc&utm_campaign=br_empresa_institucional&utm_term=gestao_de_tarefas`
- `…/affiliates?utm_source=meta&utm_medium=paid_social&utm_campaign=afiliados_lancamento&utm_content=video_50pct`

## 4. Importante: vendas via Hotmart

O checkout da Hotmart acontece **fora** do nosso site, então a conversão de compra
pela Hotmart é configurada **no painel da Hotmart** (Pixels do Hotmart: cole lá
o GA4/Meta/TikTok). No nosso site medimos visitas, cliques de CTA e o início de
checkout. Compras via **Stripe** retornam para `/welcome` (dá para disparar
`Purchase` ali quando ativarmos os IDs).

## 5. Próximos passos (quando os IDs existirem)

- [ ] Definir as env vars na Vercel + redeploy.
- [ ] Validar no GA4/Meta/TikTok que o PageView chega (modo de teste/debug).
- [ ] Marcar conversões no Google Ads/Meta (begin_checkout, Lead, Purchase).
- [ ] Colar os pixels também no painel da Hotmart (conversão do checkout externo).

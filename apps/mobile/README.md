# apps/mobile — APP MILA (Android / iOS)

App mobile (Expo SDK 56 / React Native + TypeScript). Mesmo contexto do agente
desktop: lista de pendentes agregada (todas as instâncias), criação rápida,
troca de status e **demanda por voz** (segure-e-fale com revisão/recusa).
Idioma segue a configuração da instância (corporativa prevalece).

## Rodar no celular (sem conta, sem build)
1. Instale o app **Expo Go** (App Store / Play Store).
2. No repositório: `pnpm --filter mobile start`
3. Escaneie o QR exibido no terminal com o Expo Go (Android) ou com a câmera (iOS).
4. Faça login com a mesma conta do MILA web.

## Deep link (base do widget)
`mila://record` abre o app direto no gravador de voz — é o gancho dos widgets
de tela inicial (Fase 2: Android primeiro, depois iOS; widgets nativos não podem
gravar áudio, então o gadget é um botão de microfone que abre o app gravando).

## Publicação (Fase 2)
EAS Build/Submit. Requer Apple Developer (US$99/ano) e Google Play Console
(US$25 únicos).

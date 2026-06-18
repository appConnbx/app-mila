# appMila — Runbook de publicação iOS (App Store)

Bundle: `co.appmila.mobile` · Versão 1.0.0 · Política: https://www.appmila.co/privacy

## Pré-requisito (bloqueante)
**Conta Apple Developer ATIVA** (Organização, US$99/ano, exige D-U-N-S). Enquanto
estiver "aguardando aprovação", NÃO dá para conectar o EAS nem subir ao App Store
Connect. Tudo abaixo só roda depois de aprovada.

## Assets (prontos)
- Ícone App Store **1024×1024 sem transparência**: `store/ios-assets/app-store-icon-1024.png` ✅
- Screenshots iPhone (6.7" = 1290×2796): **gerar na hora do envio** (mesmos mockups do Android, reescalados). Mínimo 1; recomendado 3–4.
- Textos: reaproveitar a ficha pt-BR da Play (`store/play-listing.md`).

## Passos (quando a conta estiver ativa)
1. **EAS ↔ Apple**: `eas credentials` (iOS) ou deixar o `eas build -p ios --profile production` gerar as credenciais (distribution cert + provisioning) automaticamente, logando na Apple.
2. **Build**: `eas build --platform ios --profile production` (gera o `.ipa`). No CI: adicionar passo iOS no `mobile-build.yml` (hoje só Android).
3. **App Store Connect**: criar o app (My Apps → +) com o bundle `co.appmila.mobile`, nome **appMila**, idioma pt-BR.
4. **Submeter**: `eas submit --platform ios --profile production --latest` — precisa preencher no `eas.json` (submit.production.ios): `appleId`, `ascAppId` (ID do app no ASC) e `appleTeamId`. Pegar esses valores no ASC após criar o app.
5. **Ficha + privacidade + App Privacy (nutrition labels)**: e-mail, descrição (reusar pt), categoria Produtividade, política de privacidade, e o questionário de privacidade (equivalente ao Data Safety: E-mail, Áudio efêmero, conteúdo do usuário — não vendido/compartilhado).
6. **Enviar para revisão** da Apple (costuma levar de ~1 a 3 dias).

## Observações
- O microfone (NSMicrophoneUsageDescription) já vem do `expo-audio` (microphonePermission no app.json) — texto: "O appMila usa o microfone para criar demandas por voz."
- Deep link `mila://record` e o widget são Android-only; no iOS o app abre normal (sem widget de home nesta versão).

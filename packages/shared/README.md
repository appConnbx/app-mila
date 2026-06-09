# @mila/shared

Lógica de negócio **pura** (sem dependência de framework), reaproveitada entre web, mobile e webhook.

Conteúdo previsto:
- `src/schemas/` — validações Zod (demanda, evento, pessoa…). Uma fonte de verdade para formulários e API.
- `src/rules/` — regras de produto testáveis: pode delegar?, % de conclusão de evento, score de talentos.
- `src/index.ts` — exports.

> Implementado na Etapa 4. Mantém web e mobile sem duplicar regras.

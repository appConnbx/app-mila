/**
 * Tags automáticas por regras de palavra-chave (sem IA / sem custo).
 * Geradas no cadastro da demanda a partir de título + descrição.
 *
 * Como evoluir: basta acrescentar termos no dicionário RULES abaixo.
 * Cada chave é a tag final; os valores são gatilhos (substrings, minúsculas, sem acento).
 */

const RULES: Record<string, string[]> = {
  comercial: ['proposta', 'comercial', 'venda', 'cliente', 'contrato', 'orcamento', 'cotacao', 'cotar', 'negociacao'],
  financeiro: ['pagamento', 'nota fiscal', 'nf', 'boleto', 'fatura', 'cobranca', 'financeiro', 'reembolso', 'despesa'],
  engenharia: ['memorial', 'projeto', 'estrutural', 'engenharia', 'planta', 'bim', 'calculo', 'obra', 'galpao'],
  suprimentos: ['fornecedor', 'compra', 'suprimento', 'material', 'estoque', 'pedido de compra'],
  rh: ['contratacao', 'admissao', 'ferias', 'folha', 'rh', 'colaborador', 'recrutamento'],
  ti: ['sistema', 'bug', 'erro', 'acesso', 'senha', 'servidor', 'deploy', 'api', 'ti'],
  juridico: ['contrato', 'juridico', 'art', 'crea', 'licenca', 'alvara', 'documentacao', 'protocolo'],
  reuniao: ['reuniao', 'ata', 'alinhamento', 'follow', 'comite', 'apresentacao'],
  qualidade: ['qualidade', 'auditoria', 'inspecao', 'checklist', 'norma'],
  marketing: ['marketing', 'campanha', 'post', 'rede social', 'evento', 'divulgacao'],
}

const PRIORITY_TAG: Record<string, string | null> = {
  alta: 'prioridade-alta',
  media: null,
  baixa: null,
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (combining marks)
}

/**
 * Gera de 1 a 4 tags para a demanda.
 * @param title título da demanda
 * @param description descrição (opcional)
 * @param priority 'alta' | 'media' | 'baixa'
 */
export function generateTags(title: string, description: string | null, priority: string): string[] {
  const haystack = normalize(`${title} ${description ?? ''}`)
  const tags: string[] = []

  for (const [tag, triggers] of Object.entries(RULES)) {
    if (triggers.some((kw) => haystack.includes(normalize(kw)))) tags.push(tag)
    if (tags.length >= 3) break
  }

  const pri = PRIORITY_TAG[priority] ?? null
  if (pri) tags.push(pri)

  // fallback: nenhuma regra bateu → marca como "geral"
  if (tags.length === 0) tags.push('geral')

  // únicas, no máximo 4
  return Array.from(new Set(tags)).slice(0, 4)
}

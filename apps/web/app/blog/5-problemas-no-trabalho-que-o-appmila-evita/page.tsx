import { postMetadata } from '../_posts'
import { BlogArticleLayout, H2, P, B } from '../_article'

export const metadata = postMetadata('5-problemas-no-trabalho-que-o-appmila-evita')

export default function Article() {
  return (
    <BlogArticleLayout slug="5-problemas-no-trabalho-que-o-appmila-evita">
      <P>
        <B>
          Equipes não perdem prazo por falta de competência — perdem porque as demandas ficam espalhadas e dependem da
          memória
        </B>
        . Veja 5 problemas que custam caro no trabalho e como o appMila evita cada um, com captura rápida, responsável,
        prazo e status.
      </P>

      <H2>1. Decisões de reunião que nunca viram ação</H2>
      <P>
        Combina-se muito e registra-se pouco. No appMila, cada decisão sai da reunião como uma demanda com dono e prazo
        — capturada por voz, sem parar para digitar.
      </P>

      <H2>2. Retrabalho e prazos estourados</H2>
      <P>
        Sem um lugar único, duas pessoas fazem a mesma coisa — ou ninguém faz. Com responsável e prazo claros e o status
        visível, o trabalho não se duplica nem cai no esquecimento.
      </P>

      <H2>3. Liderança sem visibilidade</H2>
      <P>
        “Está tudo andando?” vira achismo. O appMila mostra o que está aberto, em andamento e concluído, por pessoa e
        por equipe — a liderança enxerga execução, não promessas.
      </P>

      <H2>4. Tarefas espalhadas em e-mail, chat e cabeça</H2>
      <P>
        Quando a demanda mora em cinco lugares, ela se perde em todos. Centralizar num só painel, com captura em
        segundos, elimina o “onde foi que combinamos isso?”.
      </P>

      <H2>5. Cobrança individual cansativa</H2>
      <P>
        Ficar perguntando “e aquilo?” desgasta o time. Com prazo e status à vista, cada um acompanha o que é seu — a
        tarefa cobra sozinha, sem o gestor virar fiscal.
      </P>
    </BlogArticleLayout>
  )
}

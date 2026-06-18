import { postMetadata } from '../_posts'
import { BlogArticleLayout, H2, P, B } from '../_article'

export const metadata = postMetadata('transformar-reunioes-em-tarefas')

export default function Article() {
  return (
    <BlogArticleLayout slug="transformar-reunioes-em-tarefas">
      <P>
        <B>
          Para uma reunião virar execução, cada decisão precisa sair dela como uma tarefa com responsável e prazo —
          registrada na hora, não “depois”
        </B>
        . A ata mais bonita não adianta se o combinado não vira ação acompanhável. O segredo é capturar durante a
        conversa e acompanhar depois que ela acaba.
      </P>

      <H2>Por que decisões de reunião não saem do papel</H2>
      <P>
        No fim da reunião, todo mundo concorda — e ninguém anota com dono e data. Em uma semana, o que foi decidido
        sumiu. O problema é o intervalo entre <em>decidir</em> e <em>registrar</em>: quanto maior, mais a decisão
        evapora.
      </P>

      <H2>Capture cada combinado na hora</H2>
      <P>
        Em vez de anotar tudo no fim, registre a decisão no momento em que ela acontece. Capturar por voz é ideal aqui:
        no appMila você fala o combinado e ele vira uma demanda com responsável e prazo, sem interromper a reunião para
        digitar.
      </P>

      <H2>Atribua dono e prazo — sempre</H2>
      <P>
        “A equipe resolve” não é responsável. Toda decisão precisa de <B>uma pessoa</B> e de <B>uma data</B>. É isso que
        separa uma ata de uma lista de execução de verdade.
      </P>

      <H2>Acompanhe depois que a reunião acaba</H2>
      <P>
        O valor aparece no acompanhamento: na próxima reunião, em vez de recomeçar do zero, você revisa o que foi
        concluído, o que está em andamento e o que atrasou. As decisões deixam de se repetir reunião após reunião — elas
        andam.
      </P>
    </BlogArticleLayout>
  )
}

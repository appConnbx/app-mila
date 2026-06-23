import { B, BlogArticleLayout, H2, P } from "../_article";
import { postMetadata } from "../_posts";

export const metadata = postMetadata("nao-perder-tarefas-no-trabalho");

export default function Article() {
  return (
    <BlogArticleLayout slug="nao-perder-tarefas-no-trabalho">
      <P>
        <B>
          Para não perder tarefas no trabalho, use um sistema simples e único: capture toda demanda
          no momento em que ela surge, atribua um responsável e um prazo, e acompanhe o status até
          concluir
        </B>
        . O erro mais comum não é falta de esforço — é confiar na memória e espalhar as tarefas por
        e-mail, chat e cabeça.
      </P>

      <H2>Por que tarefas se perdem nas equipes</H2>
      <P>
        Demandas nascem em reuniões, mensagens e conversas de corredor. Sem um lugar único, cada
        pessoa guarda a sua versão — e o que ficou combinado vira “achei que era com você”. Os
        sintomas: retrabalho, prazos estourados e a liderança sem visibilidade do que realmente está
        andando.
      </P>

      <H2>Os 3 elementos de uma demanda que não se perde</H2>
      <P>
        Toda tarefa precisa de: <B>responsável</B> (uma pessoa, não “a equipe”), <B>prazo</B> (data
        clara) e <B>status</B> (aberto, em andamento, concluído). Sem esses três, é só uma anotação.
        Com eles, vira execução acompanhável.
      </P>

      <H2>Capture na hora — de preferência por voz</H2>
      <P>
        O segredo é registrar no instante em que a demanda aparece, antes de esquecer. Capturar por
        voz remove o atrito: no appMila você fala a tarefa e ela vira demanda com responsável e
        prazo. Delegue para quem é da sua equipe e acompanhe sem precisar cobrar de um em um.
      </P>

      <H2>Dê visibilidade à liderança</H2>
      <P>
        Quando tudo está em um só lugar, a liderança enxerga execução — não promessas. Você vê o que
        está atrasado, o que está em andamento e o que foi concluído, por pessoa e por equipe. É o
        que transforma “combinamos” em “entregamos”.
      </P>
    </BlogArticleLayout>
  );
}

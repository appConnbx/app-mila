import { B, BlogArticleLayout, H2, P } from "../_article";
import { postMetadata } from "../_posts";

export const metadata = postMetadata("organizar-tarefas-em-familia");

export default function Article() {
  return (
    <BlogArticleLayout slug="organizar-tarefas-em-familia">
      <P>
        <B>
          Organizar tarefas em família funciona quando cada tarefa tem um responsável e um prazo, e
          todos veem o mesmo lugar
        </B>
        . Assim, dividir deixa de ser cobrança: em vez de “você não fez”, vira “é a sua vez, até
        quinta”. Da lista de compras ao dever de casa, o combinado para de se perder.
      </P>

      <H2>Por que a divisão de tarefas vira briga</H2>
      <P>
        Sem um lugar comum, cada um lembra de um jeito — e quem cobra acaba virando o “chato” da
        casa. A bagunça não é falta de boa vontade: é falta de clareza sobre <em>quem</em> faz{" "}
        <em>o quê</em> e <em>até quando</em>.
      </P>

      <H2>Dê dono e prazo a cada tarefa</H2>
      <P>
        Atribua cada tarefa a uma pessoa (inclusive as crianças, no que for delas) e defina um prazo
        simples. Com <B>responsável</B> e <B>prazo</B> visíveis, a tarefa se cobra sozinha — ninguém
        precisa ficar lembrando o outro.
      </P>

      <H2>Capture na hora, por voz</H2>
      <P>
        As tarefas de casa surgem o tempo todo: no caminho do mercado, no jantar, antes de dormir.
        Em vez de anotar depois (e esquecer), fale: no appMila você segura o microfone, diz a tarefa
        e ela vira uma demanda para a família, com prazo para amanhã. Rápido o bastante para caber
        na correria.
      </P>

      <H2>Tudo em um lugar que todos veem</H2>
      <P>
        Quando a família compartilha a mesma lista, cada um sabe sua parte e acompanha o que falta —
        sem grupos de mensagem perdidos. E, no appMila, a conta da família convive com a do trabalho
        no mesmo app: a vida toda organizada num só lugar.
      </P>
    </BlogArticleLayout>
  );
}

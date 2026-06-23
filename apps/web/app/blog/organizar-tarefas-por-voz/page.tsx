import { B, BlogArticleLayout, H2, P } from "../_article";
import { postMetadata } from "../_posts";

export const metadata = postMetadata("organizar-tarefas-por-voz");

export default function Article() {
  return (
    <BlogArticleLayout slug="organizar-tarefas-por-voz">
      <P>
        <B>
          Organizar tarefas por voz significa capturar o que precisa ser feito apenas falando: você
          segura um botão, diz a tarefa e ela vira uma demanda com responsável e prazo
        </B>{" "}
        — sem digitar, sem abrir planilha, sem depender da memória. É a forma mais rápida de não
        perder o que foi combinado em reuniões, conversas e no corre do dia a dia.
      </P>

      <H2>Por que a gente esquece o que foi combinado</H2>
      <P>
        A maioria das tarefas nasce falando — numa reunião, num corredor, num grupo de mensagens.
        Mas quase ninguém para para anotar na hora. O resultado é o clássico “achei que você ia
        fazer”. O problema não é falta de ferramenta: é o atrito entre <em>combinar</em> e{" "}
        <em>registrar</em>. Quanto mais passos para anotar, mais tarefa se perde.
      </P>

      <H2>Captura por voz reduz o atrito a zero</H2>
      <P>
        Falar é mais rápido do que digitar. Ao transformar a fala em tarefa automaticamente, você
        registra em segundos — no momento em que a demanda surge. No appMila, você segura o
        microfone, fala por até 10 segundos e solta: a transcrição vira uma demanda com título,
        responsável e prazo para revisar antes de criar.
      </P>

      <H2>Como aplicar no trabalho e em casa</H2>
      <P>
        No <B>trabalho</B>, capture as decisões de cada reunião como demandas com responsável e
        prazo, e acompanhe a execução em um só lugar — o que está aberto, em andamento e concluído.
        Em <B>casa</B>, a mesma lógica organiza a rotina da família: cada um sabe sua parte, sem
        cobrança. Tudo na mesma conta.
      </P>

      <H2>Passo a passo para nunca mais perder uma demanda</H2>
      <P>
        1) Capture na hora (por voz) em vez de confiar na memória. 2) Defina responsável e prazo. 3)
        Acompanhe o status até concluir. 4) Use o atalho/widget para registrar em 1 toque. É um
        hábito simples que elimina o “esqueci”.
      </P>
    </BlogArticleLayout>
  );
}

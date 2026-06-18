import { postMetadata } from '../_posts'
import { BlogArticleLayout, H2, P, B, UL, LI } from '../_article'

export const metadata = postMetadata('sistema-de-demandas-simples-vs-complexo')

export default function Article() {
  return (
    <BlogArticleLayout slug="sistema-de-demandas-simples-vs-complexo">
      <P>
        <B>
          Um sistema de demandas simples vence um complexo por um motivo prático: ele é realmente usado. Ferramentas
          cheias de recursos costumam falhar não por falta de poder, mas porque o time (ou a família) desiste de
          alimentá-las
        </B>
        . E uma tarefa que ninguém registra é uma tarefa perdida.
      </P>

      <H2>O custo escondido da complexidade</H2>
      <P>
        Quadros infinitos, campos obrigatórios, automações que ninguém entende. Cada passo a mais para criar uma tarefa
        é um motivo a mais para não criar. O resultado é um sistema bonito e vazio — e as demandas reais voltando para o
        e-mail, o chat e a cabeça.
      </P>

      <H2>Simplicidade = adoção (e adoção = resultado)</H2>
      <P>
        O que faz uma ferramenta funcionar não é a lista de recursos, é a <B>constância de uso</B>. Quando registrar
        leva segundos, todo mundo registra. E é o uso diário — não o recurso avançado — que faz nada se perder.
      </P>

      <H2>O que um sistema simples precisa ter</H2>
      <P>Simples não é incompleto. O essencial que resolve 90% dos casos:</P>
      <UL>
        <LI><B>Captura rápida</B> (idealmente por voz), para registrar no instante em que a demanda surge.</LI>
        <LI><B>Responsável</B> e <B>prazo</B> em cada tarefa.</LI>
        <LI><B>Status</B> claro: aberto, em andamento, concluído.</LI>
        <LI><B>Um lugar único</B> que todos veem — trabalho e casa.</LI>
      </UL>

      <H2>appMila é simples de propósito</H2>
      <P>
        O appMila foi desenhado para esse essencial: você fala, vira demanda com responsável e prazo, e acompanha até
        concluir — no celular, no navegador e no computador. Poder sem complexidade, para o sistema ser usado de
        verdade.
      </P>
    </BlogArticleLayout>
  )
}

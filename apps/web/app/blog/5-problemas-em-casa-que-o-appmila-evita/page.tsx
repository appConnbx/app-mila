import { postMetadata } from '../_posts'
import { BlogArticleLayout, H2, P, B } from '../_article'

export const metadata = postMetadata('5-problemas-em-casa-que-o-appmila-evita')

export default function Article() {
  return (
    <BlogArticleLayout slug="5-problemas-em-casa-que-o-appmila-evita">
      <P>
        <B>
          A maioria dos atritos domésticos não vem de falta de boa vontade — vem de falta de clareza sobre quem faz o
          quê e até quando
        </B>
        . Veja 5 problemas comuns da rotina da casa e como o appMila evita cada um, transformando combinados em tarefas
        com responsável e prazo.
      </P>

      <H2>1. Esquecer compras, contas e compromissos</H2>
      <P>
        “Acabou o café”, “pagar o boleto até dia 10”, “marcar o dentista da Sofia”. Some no meio da correria. No
        appMila você captura por voz no instante em que lembra — segura o microfone, fala e vira uma tarefa com prazo.
        Nada fica só na cabeça.
      </P>

      <H2>2. Sobrecarregar uma pessoa só</H2>
      <P>
        Quando ninguém combina, tudo cai em quem “toma a frente”. Com cada tarefa tendo um <B>responsável</B> visível, a
        divisão fica clara e justa — dá para distribuir entre todos da casa, inclusive as crianças no que é delas.
      </P>

      <H2>3. Combinados que viram discussão</H2>
      <P>
        O clássico “achei que você ia fazer” acaba quando existe um registro com dono e prazo. Não é cobrança: a tarefa
        se lembra sozinha, e todos veem o mesmo lugar.
      </P>

      <H2>4. Tarefas da escola e das crianças perdidas</H2>
      <P>
        Trabalho da escola, material, reunião de pais. Capture na hora em que a mensagem chega e defina o prazo. Em vez
        de papelzinho e print perdidos, fica tudo em uma lista compartilhada da família.
      </P>

      <H2>5. Ninguém enxerga o que falta fazer</H2>
      <P>
        Sem visão do conjunto, sempre escapa algo. O appMila mostra o que está aberto, em andamento e concluído — a
        casa inteira num painel só. E a conta da família convive com a do trabalho no mesmo app.
      </P>
    </BlogArticleLayout>
  )
}

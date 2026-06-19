import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso — appMila',
  description: 'Termos de Uso do appMila: serviço, planos, pagamento, disponibilidade, reembolso e responsabilidades.',
  alternates: { canonical: 'https://www.appmila.co/terms' },
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-8 text-xl font-bold text-white">{children}</h2>
)
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 leading-relaxed text-slate-300">{children}</p>
)

// Termos de Uso públicos (exigidos pelas lojas e pela venda paga).
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface text-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-14">
        <Link href="/" className="text-sm text-brand hover:underline">← appmila.co</Link>
        <h1 className="mt-4 text-3xl font-extrabold text-white">Termos de Uso — appMila</h1>
        <p className="mt-2 text-sm text-slate-500">Última atualização: 18 de junho de 2026</p>

        <P>
          O appMila («appMila», «nós») é uma plataforma de gestão de demandas para empresas e famílias — um produto
          CONNBX, operado por Olivaldo Serafim Filho Consultoria em Tecnologia da Informação LTDA, CNPJ
          49.848.097/0001-86, Piracicaba/SP. Estes Termos regem o uso do site, do sistema web, do aplicativo móvel e do
          agente para computador.
        </P>

        <H>1. Aceitação destes Termos</H>
        <P>
          Ao criar uma conta, concluir um cadastro ou compra, ou utilizar o appMila de qualquer forma, você declara que
          leu, entendeu e concorda com estes Termos e com a{' '}
          <Link href="/privacy" className="text-brand hover:underline">Política de Privacidade</Link>. O aceite ocorre
          no momento do cadastro/primeiro acesso, na finalização da compra e pelo uso continuado do serviço. Se você
          não concorda, não utilize o appMila. Se aceitar em nome de uma empresa, declara ter poderes para vinculá-la.
        </P>

        <H>2. O serviço</H>
        <P>
          O appMila permite capturar, delegar e acompanhar demandas (inclusive por voz), no trabalho e em casa,
          disponível em sistema web, aplicativo de celular e agente para computador. Podemos evoluir, alterar ou
          remover funcionalidades a qualquer tempo para melhorar o produto.
        </P>

        <H>3. Conta e responsabilidade</H>
        <P>
          Você é responsável por manter a confidencialidade das suas credenciais e por toda atividade na sua conta.
          Comprometa-se a fornecer informações verdadeiras e a manter seus dados atualizados. Avise-nos imediatamente
          em caso de uso não autorizado.
        </P>

        <H>4. Planos, pagamento, renovação e garantia</H>
        <P>
          Há plano gratuito e planos pagos. No Brasil, as vendas são processadas pela <strong>Hotmart</strong>
          (pagamento único do plano anual, podendo ser parcelado); no internacional, por <strong>Stripe</strong>
          (assinatura recorrente em dólar). Os preços vigentes são os exibidos no momento da contratação. Oferecemos{' '}
          <strong>garantia de 7 dias</strong>: se não fizer sentido para você nesse período, devolvemos o valor pago,
          conforme os meios da plataforma de pagamento.
        </P>

        <H>5. Disponibilidade e interrupções</H>
        <P>
          Empenhamo-nos em manter o appMila disponível e estável, mas o serviço{' '}
          <strong>pode ser interrompido</strong> — de forma planejada (manutenções) ou{' '}
          <strong>não planejada</strong> (falhas técnicas, indisponibilidade de provedores de terceiros, incidentes de
          segurança, caso fortuito ou força maior). Não garantimos disponibilidade ininterrupta nem ausência de erros.
          Sempre que possível, buscaremos restabelecer o serviço o mais rápido viável e comunicar interrupções
          relevantes.
        </P>

        <H>6. Descontinuação pelo appMila e reembolso proporcional</H>
        <P>
          Caso o appMila <strong>descontinue ou encerre o serviço por iniciativa nossa</strong> (no todo ou em parte),
          comunicaremos com antecedência razoável e devolveremos o valor{' '}
          <strong>proporcional ao período já pago e ainda não utilizado</strong> (cálculo <em>pro-rata</em>) do seu
          plano. Os reembolsos são operacionalizados pelos meios da Hotmart (Brasil) ou Stripe (internacional). Esta
          devolução proporcional não se aplica a interrupções temporárias previstas no item 5, nem a encerramentos
          motivados por violação destes Termos pelo usuário.
        </P>

        <H>7. Cancelamento pelo usuário</H>
        <P>
          Você pode cancelar quando quiser. Em assinaturas (internacional), o cancelamento encerra a renovação seguinte
          e o acesso permanece até o fim do período já pago, sem novas cobranças. Em compras únicas (Brasil), aplica-se
          a garantia de 7 dias; após esse prazo, o acesso vale pelo período contratado.
        </P>

        <H>8. Uso aceitável</H>
        <P>
          Você concorda em não: usar o appMila para fins ilícitos; violar direitos de terceiros; tentar acessar áreas
          ou dados sem autorização; sobrecarregar, sondar ou comprometer a segurança do serviço; ou reproduzir,
          revender ou explorar o serviço sem autorização. Podemos suspender contas que violem estas regras.
        </P>

        <H>9. Propriedade intelectual</H>
        <P>
          O appMila, sua marca, software e conteúdos são de titularidade da operadora ou de seus licenciantes. O
          conteúdo que você registra (demandas, observações etc.) permanece seu; você nos concede licença limitada
          apenas para operar o serviço em seu benefício.
        </P>

        <H>10. Privacidade e dados</H>
        <P>
          O tratamento de dados pessoais segue a{' '}
          <Link href="/privacy" className="text-brand hover:underline">Política de Privacidade</Link>, em conformidade
          com a LGPD (Lei nº 13.709/2018).
        </P>

        <H>11. Limitação de responsabilidade</H>
        <P>
          Na máxima extensão permitida em lei, o appMila não se responsabiliza por danos indiretos, lucros cessantes ou
          perda de dados decorrentes de indisponibilidade ou uso do serviço. Nada nestes Termos exclui direitos
          irrenunciáveis do consumidor previstos no Código de Defesa do Consumidor.
        </P>

        <H>12. Alterações destes Termos</H>
        <P>
          Podemos atualizar estes Termos; a versão vigente estará sempre nesta página, com a data acima. Mudanças
          relevantes poderão ser comunicadas pelos canais do serviço. O uso após a atualização significa concordância.
        </P>

        <H>13. Lei aplicável e foro</H>
        <P>
          Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro da comarca de Piracicaba/SP para dirimir
          questões deles decorrentes, salvo regra de competência diversa aplicável ao consumidor.
        </P>

        <H>14. Contato</H>
        <P>
          Dúvidas sobre estes Termos: <strong>help@appmila.co</strong>.
        </P>
      </div>
    </div>
  )
}

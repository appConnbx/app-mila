import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade — MILA',
  description: 'Como o APP MILA coleta, usa e protege seus dados (LGPD).',
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-8 text-xl font-bold text-white">{children}</h2>
)
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 leading-relaxed text-slate-300">{children}</p>
)

// Política de privacidade pública (exigida pelas lojas Apple/Google e LGPD).
export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-surface text-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-14">
        <Link href="/" className="text-sm text-brand hover:underline">← appmila.co</Link>
        <h1 className="mt-4 text-3xl font-extrabold text-white">Política de Privacidade — APP MILA</h1>
        <p className="mt-2 text-sm text-slate-500">Última atualização: 11 de junho de 2026</p>

        <P>
          O APP MILA («MILA», «nós») é uma plataforma de gestão de demandas para empresas e
          famílias — um produto CONNBX, operado por Olivaldo Serafim Filho Consultoria em
          Tecnologia da Informação LTDA, CNPJ 49.848.097/0001-86, Piracicaba/SP. Esta política
          explica, em conformidade com a LGPD (Lei nº 13.709/2018), como tratamos seus dados no
          site, no sistema web, no aplicativo móvel e no agente desktop.
        </P>

        <H>1. Dados que coletamos</H>
        <P>
          <strong>Conta:</strong> nome, e-mail e senha (armazenada de forma criptografada).{' '}
          <strong>Conteúdo:</strong> demandas, eventos, observações e demais informações que você
          ou sua organização registram. <strong>Perfil:</strong> foto, telefone e habilidades, se
          você os adicionar. <strong>Uso técnico:</strong> registros de acesso e atividade
          necessários à segurança e ao funcionamento (ex.: controle de sessão).
        </P>

        <H>2. Voz e microfone</H>
        <P>
          A criação de demandas por voz grava um áudio curto (até 10 segundos) apenas quando você
          pressiona o botão de microfone. O áudio é enviado de forma segura ao nosso servidor e
          encaminhado a um provedor de transcrição (Groq, tecnologia Whisper) exclusivamente para
          convertê-lo em texto. <strong>O áudio não é armazenado</strong> por nós após a
          transcrição; somente o texto resultante vira uma demanda, que você pode revisar e
          recusar antes de criar.
        </P>

        <H>3. Como usamos os dados</H>
        <P>
          Para operar o serviço (criar, listar e acompanhar demandas), autenticar o acesso,
          processar assinaturas, prestar suporte e melhorar o produto. Não vendemos seus dados
          nem os usamos para publicidade de terceiros.
        </P>

        <H>4. Compartilhamento com operadores</H>
        <P>
          Usamos provedores que processam dados em nosso nome, sob contrato: Supabase
          (banco de dados e autenticação), Vercel (hospedagem do site e APIs), Groq (transcrição
          de voz) e Hotmart (processamento de pagamentos e assinaturas — os dados de pagamento
          são tratados diretamente pela Hotmart). Compartilhamos somente o necessário para cada
          finalidade.
        </P>

        <H>5. Privacidade dentro das organizações</H>
        <P>
          Demandas marcadas como privadas são visíveis apenas aos envolvidos. Administradores
          gerenciam a estrutura e veem indicadores agregados conforme seu papel, respeitando as
          regras de visibilidade do sistema.
        </P>

        <H>6. Retenção e exclusão</H>
        <P>
          Mantemos os dados enquanto a conta ou a assinatura estiverem ativas e pelo prazo
          necessário a obrigações legais. Você pode solicitar a exclusão da sua conta e dos seus
          dados pessoais a qualquer momento pelo e-mail abaixo.
        </P>

        <H>7. Seus direitos (LGPD)</H>
        <P>
          Você pode solicitar confirmação de tratamento, acesso, correção, anonimização,
          portabilidade, exclusão e informações sobre compartilhamento, além de revogar
          consentimentos. Atendemos pelo canal: <strong>help@appmila.co</strong>.
        </P>

        <H>8. Segurança</H>
        <P>
          Tráfego criptografado (HTTPS), senhas com hash, isolamento por instância com regras de
          acesso no banco de dados (RLS) e princípio do menor privilégio nos serviços internos.
        </P>

        <H>9. Alterações</H>
        <P>
          Esta política pode ser atualizada; a versão vigente estará sempre nesta página, com a
          data acima. Dúvidas: <strong>help@appmila.co</strong>.
        </P>
      </div>
    </div>
  )
}

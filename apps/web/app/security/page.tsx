import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Segurança — appMila',
  description: 'Como o appMila protege os dados da sua empresa e da sua família.',
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-8 text-xl font-bold text-white">{children}</h2>
)
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 leading-relaxed text-slate-300">{children}</p>
)

// Página pública de segurança (compradores corporativos e lojas de aplicativos).
export default function SegurancaPage() {
  return (
    <div className="min-h-screen bg-surface text-slate-200">
      <div className="mx-auto max-w-3xl px-4 py-14">
        <Link href="/" className="text-sm text-brand hover:underline">← appmila.co</Link>
        <h1 className="mt-4 text-3xl font-extrabold text-white">Segurança no appMila</h1>
        <p className="mt-2 text-sm text-slate-500">Última atualização: 12 de junho de 2026</p>

        <P>
          O appMila foi desenhado para empresas e famílias confiarem suas demandas do dia a dia.
          Abaixo, como protegemos seus dados em todas as camadas — site, sistema web, agente
          desktop e aplicativo móvel.
        </P>

        <H>Criptografia em trânsito</H>
        <P>
          Todo o tráfego entre seus dispositivos e nossos servidores usa HTTPS/TLS. Não há
          comunicação em texto puro em nenhum componente do produto.
        </P>

        <H>Isolamento por instância (RLS)</H>
        <P>
          Cada instância (empresa ou família) é isolada no banco de dados por políticas de
          Row Level Security: as regras de visibilidade são aplicadas pelo próprio banco, não
          apenas pela interface. Demandas privadas são visíveis somente aos envolvidos — inclusive
          para administradores.
        </P>

        <H>Autenticação e sessões</H>
        <P>
          Senhas armazenadas com hash criptográfico (nunca em texto). Sessões com tokens de curta
          duração renovados automaticamente; no sistema web, sessões inativas expiram em 30
          minutos.
        </P>

        <H>Voz sem retenção de áudio</H>
        <P>
          A criação de demandas por voz envia o áudio (máx. 10s) apenas para transcrição e
          descarta-o em seguida. Somente o texto resultante é armazenado — e você revisa antes de
          criar.
        </P>

        <H>Infraestrutura</H>
        <P>
          Banco de dados e autenticação no Supabase e aplicações na Vercel — provedores com
          certificações de mercado (SOC 2), backups automáticos e alta disponibilidade. Chaves e
          segredos ficam exclusivamente no servidor, nunca nos aplicativos instalados.
        </P>

        <H>Atualizações assinadas</H>
        <P>
          O agente desktop só aceita atualizações assinadas criptograficamente pela CONNBX,
          impedindo a injeção de versões falsas.
        </P>

        <H>LGPD e privacidade</H>
        <P>
          O tratamento de dados segue a LGPD — detalhes, direitos do titular e canal de contato
          na nossa <Link href="/privacy" className="text-brand hover:underline">Política de
          Privacidade</Link>.
        </P>

        <H>Reporte de vulnerabilidades</H>
        <P>
          Encontrou um problema de segurança? Escreva para <strong>help@appmila.co</strong> com o
          assunto «Segurança» — respondemos com prioridade.
        </P>
      </div>
    </div>
  )
}

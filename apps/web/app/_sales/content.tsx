import type { SalesContent } from "./SalesPage";
import { corpPlansBR, corpPlansINTL, famPlansBR, famPlansINTL } from "./plans";

/* Conteúdo das páginas de vendas (LP para anúncios).
   Idioma fixo por página (não usa cookie de locale). Copy verdadeira:
   sem promessas de resultado, sem depoimentos inventados. A seção de prova
   social fica vazia até o cliente fornecer depoimentos REAIS. */

const COMPANY_BR =
  "appMila é um produto CONNBX — Olivaldo Serafim Filho Consultoria em Tecnologia da Informação LTDA · CNPJ 49.848.097/0001-86 · Piracicaba/SP, Brasil.";
const COMPANY_INTL =
  "appMila is a CONNBX product — Olivaldo Serafim Filho Consultoria em Tecnologia da Informação LTDA · Tax ID 49.848.097/0001-86 · Piracicaba/SP, Brazil.";
const SUPPORT = "help@appmila.co";

const hlBrand = (s: string) => <span className="text-brand">{s}</span>;
const hlOrange = (s: string) => <span className="text-orange-300">{s}</span>;

/* ============================ BR · EMPRESA ============================ */
export const brEmpresa: SalesContent = {
  locale: "pt-BR",
  accent: "brand",
  showFamilyBonus: true,
  badge: "Para empresas e equipes",
  headline: <>Sua equipe {hlBrand("para de perder demanda")} no boca a boca</>,
  subtitle:
    "O appMila transforma o que é combinado em reuniões, conversas e corredores em tarefas com responsável, prazo e acompanhamento — para a liderança enxergar a execução, não só promessas.",
  ctaPrimary: "Ver planos",
  trustline: "Garantia de 7 dias · Acesso imediato · Cancele quando quiser",
  heroBullets: [
    "Captura por voz e texto",
    "Painéis por área e equipe",
    "Bônus Family Plus para cada colaborador",
  ],

  painKicker: "O problema",
  painTitle: "Quanto custa cada demanda que some na correria?",
  painSubtitle:
    'Não é só o esquecimento. É o retrabalho, o prazo estourado, a cobrança que não sai e a confiança que se desgasta a cada "achei que alguém ia resolver".',
  pains: [
    {
      p: "“Ficou combinado, mas ninguém anotou.”",
      r: "Toda decisão vira tarefa com responsável e prazo, na hora.",
    },
    {
      p: "“Não sei o que a equipe está fazendo.”",
      r: "Painéis em tempo real por pessoa, equipe e área.",
    },
    {
      p: "“Cobro pelo WhatsApp e me perco.”",
      r: "Um só lugar para delegar, acompanhar e concluir.",
    },
  ],

  solKicker: "A solução",
  solTitle: "Da conversa à conclusão, com a empresa inteira no mesmo trilho",
  solDesc:
    "Estruture a organização como ela é — Áreas e Equipes — e dê a cada gestor a visão do que está acontecendo. Capture rápido, delegue com clareza e acompanhe resultados.",
  features: [
    {
      t: "Captura por voz",
      d: "Segure o microfone, fale e solte: a transcrição vira demanda com prazo. No computador e no celular.",
    },
    {
      t: "Estrutura corporativa",
      d: "Organização, áreas e equipes — com permissões e visão por escopo para cada gestor.",
    },
    {
      t: "Delegação com prazo",
      d: "Defina responsável, prazo e prioridade. Cada um sabe exatamente o que fazer.",
    },
    {
      t: "Painéis de produtividade",
      d: "Acompanhe o andamento por pessoa, equipe e área, e destaque quem entrega.",
    },
    {
      t: "Gadget no computador",
      d: "Um atalho discreto na lateral da tela (Windows): pendências sempre à vista e criação em 1 toque.",
    },
    {
      t: "Eventos que viram tarefa",
      d: "Reuniões e follow-ups capturam as demandas combinadas, sem nada se perder.",
    },
  ],

  howTitle: "Como funciona, em 4 passos",
  howSub: "Simples o bastante para a equipe adotar no primeiro dia.",
  steps: [
    { n: "01", t: "Capture", d: "Anote a demanda na hora — por voz ou texto, em segundos." },
    { n: "02", t: "Delegue", d: "Responsável, prazo e prioridade. Para você ou para o time." },
    { n: "03", t: "Acompanhe", d: "Veja o status de tudo em painéis por escopo." },
    { n: "04", t: "Conclua", d: "Registre o que foi feito. Vira histórico e indicador." },
  ],

  authTitle: "Por que criamos o appMila",
  authBody: [
    "O appMila nasceu dentro da CONNBX, uma consultoria de tecnologia, da dor real de ver decisões importantes se perderem entre reuniões, mensagens e a memória de cada um.",
    "Testamos planilhas, grupos de mensagem e ferramentas complexas demais. Nada resolvia o essencial: capturar a demanda em segundos e garantir que ela chegasse a alguém, com prazo. Então construímos a ferramenta que faltava — e abrimos para outras empresas.",
  ],
  authSignature: "— Equipe CONNBX, criadora do appMila",

  plansKicker: "Planos corporativos",
  plansTitle: "Escolha pelo tamanho da sua equipe",
  plansSub:
    "Plano anual, cobrado em até 12x no cartão. Todo colaborador ganha um Family Plus licenciado enquanto a empresa mantiver o plano.",
  plans: corpPlansBR({
    users: ["até 20 usuários", "até 50 usuários", "até 200 usuários", "usuários ilimitados"],
    cta: "Assinar",
    popular: "A escolha da maioria",
  }),

  guaranteeTitle: "Garantia incondicional de 7 dias",
  guaranteeBody:
    "Experimente sem risco. Se nos primeiros 7 dias o appMila não fizer sentido para a sua empresa, devolvemos 100% do valor — sem perguntas.",

  faqTitle: "Perguntas frequentes",
  faqs: [
    {
      q: "Como funciona a cobrança?",
      a: "O plano é anual e pode ser parcelado em até 12x no cartão de crédito. O pagamento é processado com segurança em ambiente criptografado.",
    },
    {
      q: "Preciso instalar algo?",
      a: "Não é obrigatório. O appMila funciona no navegador. Há também um gadget para Windows e o app de celular, opcionais.",
    },
    {
      q: "O que é o bônus Family Plus?",
      a: "Cada colaborador do plano corporativo ganha um plano Family Plus licenciado para organizar a casa e a família, enquanto a empresa mantiver a assinatura.",
    },
    {
      q: "Posso aumentar o número de usuários depois?",
      a: "Sim. É só migrar para um plano maior a qualquer momento, conforme a equipe cresce.",
    },
    {
      q: "E se eu quiser cancelar?",
      a: "Você cancela quando quiser. Nos primeiros 7 dias o reembolso é integral.",
    },
  ],

  finalTitle: "Coloque a execução da empresa no lugar",
  finalSub: "Comece hoje e veja, ainda esta semana, o que estava se perdendo.",
  finalCta: "Quero organizar minha equipe",

  footerCompany: COMPANY_BR,
  footerDisclaimer:
    "appMila é um software de organização de demandas e produtividade. Não comercializamos nem prometemos resultados financeiros. Pagamentos processados em ambiente seguro e criptografado.",
  privacyLabel: "Política de Privacidade",
  termsLabel: "Segurança",
  supportEmail: SUPPORT,
};

/* ============================ BR · PESSOAL ============================ */
export const brPessoal: SalesContent = {
  locale: "pt-BR",
  accent: "orange",
  badge: "Para a casa e a família",
  headline: <>Combinados claros, {hlOrange("casa em harmonia")}</>,
  subtitle:
    "Chega de “achei que você ia fazer”. O appMila organiza o que precisa ser feito em casa — com responsável, prazo e lembrete — para cada um saber sua parte sem cobrança.",
  ctaPrimary: "Ver planos",
  trustline: "Garantia de 7 dias · Comece em minutos · Cancele quando quiser",
  heroBullets: ["Captura por voz e texto", "Até 5 ou 10 pessoas", "No celular e no computador"],

  painKicker: "O dia a dia",
  painTitle: "A rotina da casa não cabe só na cabeça",
  painSubtitle:
    "Mercado, contas, escola, consertos, remédios, compromissos. O que não está anotado vira esquecimento — e o esquecimento vira discussão.",
  pains: [
    {
      p: "“Achei que você tinha resolvido.”",
      r: "Cada combinado tem dono e prazo. Sem mal-entendido.",
    },
    { p: "“Esqueci de pagar / marcar / comprar.”", r: "Lembretes para não deixar nada passar." },
    {
      p: "“Fico sobrecarregado(a) com tudo.”",
      r: "Divida as tarefas de forma justa e visível para todos.",
    },
  ],

  solKicker: "A solução",
  solTitle: "A casa toda organizada, no mesmo lugar",
  solDesc:
    "Sem burocracia: cadastre as pessoas da família e organize o que precisa ser feito. Simples de usar até para quem não gosta de aplicativo.",
  features: [
    {
      t: "Captura por voz",
      d: "Lembrou de algo? Fale e vira tarefa com prazo. No celular ou no computador.",
    },
    { t: "Tarefas com responsável", d: "Quem faz o quê, até quando. Cada um enxerga a sua parte." },
    { t: "Lembretes", d: "Nada de boleto vencido ou compromisso perdido." },
    { t: "Casa e pessoal juntos", d: "Mercado, contas, escola e compromissos em um só lugar." },
    {
      t: "Comunicação clara",
      d: "O que foi combinado fica registrado — e deixa de virar discussão.",
    },
    { t: "No bolso", d: "App no celular com a mesma conta em todos os aparelhos." },
  ],

  howTitle: "Como funciona, em 4 passos",
  howSub: "Tão simples que a família inteira usa.",
  steps: [
    { n: "01", t: "Cadastre", d: "Adicione as pessoas da família em segundos." },
    { n: "02", t: "Anote", d: "Capture a tarefa por voz ou texto." },
    { n: "03", t: "Combine", d: "Defina quem faz e até quando." },
    { n: "04", t: "Acompanhe", d: "Veja o que está feito e o que falta." },
  ],

  authTitle: "De uma ferramenta de empresa para a sua casa",
  authBody: [
    "O appMila começou ajudando empresas a não perder demandas. Mas a mesma bagunça acontece em casa — só que com gente que a gente ama.",
    "Por isso criamos os planos família: a mesma praticidade de capturar por voz e combinar com prazo, num formato simples, sem estrutura corporativa, por um preço acessível.",
  ],
  authSignature: "— Equipe CONNBX, criadora do appMila",

  plansKicker: "Planos família",
  plansTitle: "Escolha pelo tamanho da sua família",
  plansSub: "Plano anual com preço acessível, podendo parcelar em até 12x no cartão.",
  plans: famPlansBR({
    users: ["até 5 pessoas", "até 10 pessoas"],
    cta: "Começar com a família",
    popular: "O queridinho das famílias",
  }),
  freeNote: {
    text: "Quer testar sem cartão? Comece com o Family Free — 1 pessoa e até 15 tarefas por dia.",
    cta: "Criar conta gratuita",
    href: "/start-family-free",
  },

  guaranteeTitle: "Garantia de 7 dias",
  guaranteeBody:
    "Use por 7 dias. Se não fizer sentido para a sua família, devolvemos 100% do valor — sem burocracia.",

  faqTitle: "Perguntas frequentes",
  faqs: [
    {
      q: "Como funciona a cobrança?",
      a: "O plano é anual e pode ser parcelado em até 12x no cartão. O pagamento é processado com segurança em ambiente criptografado.",
    },
    {
      q: "É difícil de usar?",
      a: "Não. Foi feito para ser simples — adiciona as pessoas, anota as tarefas e pronto. Funciona no navegador e no celular.",
    },
    {
      q: "Posso testar de graça?",
      a: "Sim. O Family Free permite 1 pessoa e até 15 tarefas por dia, sem cartão.",
    },
    {
      q: "Qual a diferença entre Family e Family Plus?",
      a: "O Family atende até 5 pessoas; o Family Plus, até 10. O restante das funções é igual.",
    },
    { q: "Consigo cancelar?", a: "Quando quiser. Nos primeiros 7 dias o reembolso é integral." },
  ],

  finalTitle: "Menos cobrança, mais harmonia em casa",
  finalSub: "Organize a rotina da família e tire o peso da sua cabeça.",
  finalCta: "Quero organizar minha família",

  footerCompany: COMPANY_BR,
  footerDisclaimer:
    "appMila é um software de organização de tarefas e produtividade. Pagamentos processados em ambiente seguro e criptografado.",
  privacyLabel: "Política de Privacidade",
  termsLabel: "Segurança",
  supportEmail: SUPPORT,
};

/* ============================ EN · BUSINESS ============================ */
export const enBusiness: SalesContent = {
  locale: "en",
  accent: "brand",
  showFamilyBonus: true,
  badge: "For companies and teams",
  headline: <>Stop letting your team {hlBrand("lose tasks")} in hallway conversations</>,
  subtitle:
    "appMila turns what gets agreed in meetings, chats and hallways into tasks with an owner, a deadline and follow-up — so leadership sees execution, not just promises.",
  ctaPrimary: "See plans",
  trustline: "7-day guarantee · Instant access · Cancel anytime",
  heroBullets: [
    "Voice & text capture",
    "Dashboards by team & area",
    "Family Plus bonus for every employee",
  ],

  painKicker: "The problem",
  painTitle: "What does every dropped task really cost you?",
  painSubtitle:
    "It is not just forgetting. It is the rework, the missed deadline, the follow-up that never happens and the trust that erodes with every “I thought someone had it.”",
  pains: [
    {
      p: "“We agreed on it, but nobody wrote it down.”",
      r: "Every decision becomes a task with an owner and a deadline, instantly.",
    },
    {
      p: "“I don’t know what my team is doing.”",
      r: "Real-time dashboards by person, team and area.",
    },
    {
      p: "“I chase people on chat and lose track.”",
      r: "One place to delegate, follow up and complete.",
    },
  ],

  solKicker: "The solution",
  solTitle: "From conversation to completion, with the whole company aligned",
  solDesc:
    "Model your organization the way it really is — Areas and Teams — and give each manager visibility into what is happening. Capture fast, delegate clearly, track results.",
  features: [
    {
      t: "Voice capture",
      d: "Hold the mic, speak, release: the transcript becomes a task with a deadline. On desktop and mobile.",
    },
    {
      t: "Corporate structure",
      d: "Organization, areas and teams — with permissions and scoped views for each manager.",
    },
    {
      t: "Delegation with deadlines",
      d: "Set owner, due date and priority. Everyone knows exactly what to do.",
    },
    {
      t: "Productivity dashboards",
      d: "Track progress by person, team and area, and spotlight top performers.",
    },
    {
      t: "Desktop gadget",
      d: "A discreet shortcut docked to your screen edge (Windows): tasks always in sight, one-tap capture.",
    },
    {
      t: "Meetings that become tasks",
      d: "Meetings and follow-ups capture every agreed task, so nothing slips.",
    },
  ],

  howTitle: "How it works, in 4 steps",
  howSub: "Simple enough for the team to adopt on day one.",
  steps: [
    { n: "01", t: "Capture", d: "Jot the task right away — by voice or text, in seconds." },
    { n: "02", t: "Delegate", d: "Owner, deadline and priority. For you or your team." },
    { n: "03", t: "Track", d: "See the status of everything in scoped dashboards." },
    { n: "04", t: "Complete", d: "Log what was done. It becomes history and a metric." },
  ],

  authTitle: "Why we built appMila",
  authBody: [
    "appMila was born inside CONNBX, a technology consultancy, out of the real pain of watching important decisions get lost between meetings, messages and everyone’s memory.",
    "We tried spreadsheets, chat groups and overly complex tools. None solved the essential: capture a task in seconds and make sure it reached someone, with a deadline. So we built the tool we were missing — and opened it to other companies.",
  ],
  authSignature: "— The CONNBX team, makers of appMila",

  plansKicker: "Corporate plans",
  plansTitle: "Choose by the size of your team",
  plansSub:
    "Monthly subscription. Every employee gets a licensed Family Plus while the company keeps the plan.",
  plans: corpPlansINTL({
    users: ["up to 20 users", "up to 50 users", "up to 200 users", "unlimited users"],
    cta: "Subscribe",
    popular: "Most popular",
    unit: "/month",
    next: "/en-business",
  }),

  guaranteeTitle: "7-day money-back guarantee",
  guaranteeBody:
    "Try it risk-free. If appMila isn’t right for your company within the first 7 days, we refund 100% — no questions asked.",

  faqTitle: "Frequently asked questions",
  faqs: [
    {
      q: "How does billing work?",
      a: "A monthly subscription, processed securely. Cancel anytime.",
    },
    {
      q: "Do I need to install anything?",
      a: "No. appMila runs in the browser. There is also an optional Windows gadget and a mobile app.",
    },
    {
      q: "What is the Family Plus bonus?",
      a: "Every employee on a corporate plan gets a licensed Family Plus to organize home and family, while the company keeps the subscription.",
    },
    {
      q: "Can I add more users later?",
      a: "Yes. Move to a larger plan anytime as your team grows.",
    },
    {
      q: "What if I want to cancel?",
      a: "Cancel anytime. Within the first 7 days the refund is full.",
    },
  ],

  finalTitle: "Put your company’s execution back on track",
  finalSub: "Start today and see this week what was slipping through.",
  finalCta: "Organize my team",

  footerCompany: COMPANY_INTL,
  footerDisclaimer:
    "appMila is task-management and productivity software. We do not sell or promise financial results. Payments are processed securely.",
  privacyLabel: "Privacy Policy",
  termsLabel: "Security",
  supportEmail: SUPPORT,
};

/* ============================ EN · PERSONAL ============================ */
export const enPersonal: SalesContent = {
  locale: "en",
  accent: "orange",
  badge: "For home and family",
  headline: <>Clear agreements, {hlOrange("a calmer home")}</>,
  subtitle:
    "No more “I thought you were doing that.” appMila organizes what needs to get done at home — with an owner, a deadline and reminders — so everyone knows their part without nagging.",
  ctaPrimary: "See plans",
  trustline: "7-day guarantee · Start in minutes · Cancel anytime",
  heroBullets: ["Voice & text capture", "Up to 5 or 10 people", "On phone and computer"],

  painKicker: "Daily life",
  painTitle: "A household won’t fit in your head alone",
  painSubtitle:
    "Groceries, bills, school, repairs, appointments. What isn’t written down gets forgotten — and forgetting turns into arguments.",
  pains: [
    {
      p: "“I thought you had handled it.”",
      r: "Every agreement has an owner and a deadline. No misunderstandings.",
    },
    { p: "“I forgot to pay / book / buy it.”", r: "Reminders so nothing slips by." },
    { p: "“I’m carrying everything myself.”", r: "Split tasks fairly, visible to everyone." },
  ],

  solKicker: "The solution",
  solTitle: "The whole household, organized in one place",
  solDesc:
    "No bureaucracy: add your family members and organize what needs doing. Simple enough even for people who dislike apps.",
  features: [
    {
      t: "Voice capture",
      d: "Remembered something? Say it and it becomes a task with a deadline. On phone or computer.",
    },
    { t: "Tasks with an owner", d: "Who does what, by when. Everyone sees their part." },
    { t: "Reminders", d: "No more overdue bills or missed appointments." },
    {
      t: "Home and personal together",
      d: "Groceries, bills, school and appointments in one place.",
    },
    {
      t: "Clear communication",
      d: "What was agreed is on record — and stops becoming an argument.",
    },
    { t: "In your pocket", d: "A mobile app with the same account across all devices." },
  ],

  howTitle: "How it works, in 4 steps",
  howSub: "So simple the whole family uses it.",
  steps: [
    { n: "01", t: "Add", d: "Add your family members in seconds." },
    { n: "02", t: "Note", d: "Capture the task by voice or text." },
    { n: "03", t: "Agree", d: "Set who does it and by when." },
    { n: "04", t: "Track", d: "See what’s done and what’s left." },
  ],

  authTitle: "From a business tool to your home",
  authBody: [
    "appMila started by helping companies stop losing tasks. But the same chaos happens at home — only with the people we love.",
    "So we created the family plans: the same ease of voice capture and agreed deadlines, in a simple format, with no corporate structure, at an affordable price.",
  ],
  authSignature: "— The CONNBX team, makers of appMila",

  plansKicker: "Family plans",
  plansTitle: "Choose by the size of your family",
  plansSub: "Affordable monthly subscription. Cancel anytime.",
  plans: famPlansINTL({
    users: ["up to 5 people", "up to 10 people"],
    cta: "Start with your family",
    popular: "Families’ favorite",
    unit: "/month",
    next: "/en-personal",
  }),
  freeNote: {
    text: "Want to try without a card? Start with Family Free — 1 person and up to 15 tasks per day.",
    cta: "Create a free account",
    href: "/start-family-free",
  },

  guaranteeTitle: "7-day guarantee",
  guaranteeBody:
    "Use it for 7 days. If it isn’t right for your family, we refund 100% — no hassle.",

  faqTitle: "Frequently asked questions",
  faqs: [
    {
      q: "How does billing work?",
      a: "A monthly subscription, processed securely. Cancel anytime.",
    },
    {
      q: "Is it hard to use?",
      a: "No. It was built to be simple — add people, note the tasks, done. Works in the browser and on mobile.",
    },
    {
      q: "Can I try it for free?",
      a: "Yes. Family Free allows 1 person and up to 15 tasks per day, no card required.",
    },
    {
      q: "Family vs. Family Plus?",
      a: "Family covers up to 5 people; Family Plus, up to 10. Everything else is the same.",
    },
    { q: "Can I cancel?", a: "Anytime. Within the first 7 days the refund is full." },
  ],

  finalTitle: "Less nagging, more harmony at home",
  finalSub: "Organize your family’s routine and take the weight off your mind.",
  finalCta: "Organize my family",

  footerCompany: COMPANY_INTL,
  footerDisclaimer:
    "appMila is task-management and productivity software. Payments are processed securely.",
  privacyLabel: "Privacy Policy",
  termsLabel: "Security",
  supportEmail: SUPPORT,
};

/* ============================ ES · BUSINESS ============================ */
export const esBusiness: SalesContent = {
  locale: "es",
  accent: "brand",
  showFamilyBonus: true,
  badge: "Para empresas y equipos",
  headline: <>Que tu equipo {hlBrand("deje de perder tareas")} en conversaciones de pasillo</>,
  subtitle:
    "appMila convierte lo que se acuerda en reuniones, chats y pasillos en tareas con responsable, plazo y seguimiento — para que la dirección vea ejecución, no solo promesas.",
  ctaPrimary: "Ver planes",
  trustline: "Garantía de 7 días · Acceso inmediato · Cancela cuando quieras",
  heroBullets: [
    "Captura por voz y texto",
    "Paneles por equipo y área",
    "Bono Family Plus para cada empleado",
  ],

  painKicker: "El problema",
  painTitle: "¿Cuánto cuesta cada tarea que se pierde en la prisa?",
  painSubtitle:
    "No es solo el olvido. Es el retrabajo, el plazo vencido, el seguimiento que no sale y la confianza que se desgasta con cada “pensé que alguien lo haría”.",
  pains: [
    {
      p: "“Lo acordamos, pero nadie lo anotó.”",
      r: "Cada decisión se convierte en tarea con responsable y plazo, al instante.",
    },
    {
      p: "“No sé qué está haciendo mi equipo.”",
      r: "Paneles en tiempo real por persona, equipo y área.",
    },
    {
      p: "“Persigo a la gente por chat y me pierdo.”",
      r: "Un solo lugar para delegar, dar seguimiento y completar.",
    },
  ],

  solKicker: "La solución",
  solTitle: "De la conversación a la conclusión, con toda la empresa alineada",
  solDesc:
    "Modela tu organización como realmente es — Áreas y Equipos — y dale a cada responsable visibilidad de lo que ocurre. Captura rápido, delega con claridad y mide resultados.",
  features: [
    {
      t: "Captura por voz",
      d: "Mantén el micrófono, habla y suelta: la transcripción se vuelve tarea con plazo. En computadora y móvil.",
    },
    {
      t: "Estructura corporativa",
      d: "Organización, áreas y equipos — con permisos y vistas por alcance para cada responsable.",
    },
    {
      t: "Delegación con plazo",
      d: "Define responsable, fecha y prioridad. Cada uno sabe exactamente qué hacer.",
    },
    {
      t: "Paneles de productividad",
      d: "Sigue el avance por persona, equipo y área, y destaca a quien entrega.",
    },
    {
      t: "Gadget de escritorio",
      d: "Un acceso discreto en el borde de la pantalla (Windows): tareas siempre a la vista, captura en un toque.",
    },
    {
      t: "Reuniones que se vuelven tareas",
      d: "Reuniones y seguimientos capturan cada tarea acordada, sin que nada se escape.",
    },
  ],

  howTitle: "Cómo funciona, en 4 pasos",
  howSub: "Tan simple que el equipo lo adopta el primer día.",
  steps: [
    { n: "01", t: "Captura", d: "Anota la tarea al momento — por voz o texto, en segundos." },
    { n: "02", t: "Delega", d: "Responsable, plazo y prioridad. Para ti o tu equipo." },
    { n: "03", t: "Sigue", d: "Mira el estado de todo en paneles por alcance." },
    { n: "04", t: "Completa", d: "Registra lo hecho. Se vuelve historial e indicador." },
  ],

  authTitle: "Por qué creamos appMila",
  authBody: [
    "appMila nació dentro de CONNBX, una consultora de tecnología, del dolor real de ver decisiones importantes perderse entre reuniones, mensajes y la memoria de cada uno.",
    "Probamos hojas de cálculo, grupos de chat y herramientas demasiado complejas. Nada resolvía lo esencial: capturar una tarea en segundos y asegurar que llegara a alguien, con plazo. Así construimos la herramienta que faltaba — y la abrimos a otras empresas.",
  ],
  authSignature: "— El equipo de CONNBX, creadores de appMila",

  plansKicker: "Planes corporativos",
  plansTitle: "Elige según el tamaño de tu equipo",
  plansSub:
    "Suscripción mensual. Cada empleado recibe un Family Plus con licencia mientras la empresa mantenga el plan.",
  plans: corpPlansINTL({
    users: ["hasta 20 usuarios", "hasta 50 usuarios", "hasta 200 usuarios", "usuarios ilimitados"],
    cta: "Suscribirse",
    popular: "El más elegido",
    unit: "/mes",
    next: "/es-business",
  }),

  guaranteeTitle: "Garantía de 7 días",
  guaranteeBody:
    "Pruébalo sin riesgo. Si appMila no encaja con tu empresa en los primeros 7 días, devolvemos el 100% — sin preguntas.",

  faqTitle: "Preguntas frecuentes",
  faqs: [
    {
      q: "¿Cómo funciona el cobro?",
      a: "Una suscripción mensual, procesada de forma segura. Cancela cuando quieras.",
    },
    {
      q: "¿Necesito instalar algo?",
      a: "No. appMila funciona en el navegador. También hay un gadget para Windows y una app móvil, opcionales.",
    },
    {
      q: "¿Qué es el bono Family Plus?",
      a: "Cada empleado del plan corporativo recibe un Family Plus con licencia para organizar el hogar y la familia, mientras la empresa mantenga la suscripción.",
    },
    {
      q: "¿Puedo agregar más usuarios después?",
      a: "Sí. Cambia a un plan mayor cuando quieras, a medida que crece el equipo.",
    },
    {
      q: "¿Y si quiero cancelar?",
      a: "Cancela cuando quieras. En los primeros 7 días el reembolso es total.",
    },
  ],

  finalTitle: "Pon la ejecución de tu empresa en su lugar",
  finalSub: "Empieza hoy y verás esta misma semana lo que se estaba perdiendo.",
  finalCta: "Organizar mi equipo",

  footerCompany: COMPANY_INTL,
  footerDisclaimer:
    "appMila es software de gestión de tareas y productividad. No vendemos ni prometemos resultados financieros. Pagos procesados de forma segura.",
  privacyLabel: "Política de Privacidad",
  termsLabel: "Seguridad",
  supportEmail: SUPPORT,
};

/* ============================ ES · PERSONAL ============================ */
export const esPersonal: SalesContent = {
  locale: "es",
  accent: "orange",
  badge: "Para el hogar y la familia",
  headline: <>Acuerdos claros, {hlOrange("un hogar más tranquilo")}</>,
  subtitle:
    "Se acabó el “pensé que tú lo harías”. appMila organiza lo que hay que hacer en casa — con responsable, plazo y recordatorios — para que cada uno sepa su parte sin reclamos.",
  ctaPrimary: "Ver planes",
  trustline: "Garantía de 7 días · Empieza en minutos · Cancela cuando quieras",
  heroBullets: ["Captura por voz y texto", "Hasta 5 o 10 personas", "En el móvil y la computadora"],

  painKicker: "El día a día",
  painTitle: "Un hogar no cabe solo en tu cabeza",
  painSubtitle:
    "Súper, cuentas, escuela, arreglos, citas. Lo que no se anota se olvida — y el olvido se vuelve discusión.",
  pains: [
    {
      p: "“Pensé que lo habías resuelto.”",
      r: "Cada acuerdo tiene responsable y plazo. Sin malentendidos.",
    },
    { p: "“Olvidé pagar / agendar / comprar.”", r: "Recordatorios para que nada se escape." },
    {
      p: "“Cargo con todo yo solo(a).”",
      r: "Reparte las tareas de forma justa y visible para todos.",
    },
  ],

  solKicker: "La solución",
  solTitle: "Todo el hogar, organizado en un solo lugar",
  solDesc:
    "Sin burocracia: agrega a los miembros de tu familia y organiza lo que hay que hacer. Simple incluso para quien no le gustan las apps.",
  features: [
    {
      t: "Captura por voz",
      d: "¿Te acordaste de algo? Dilo y se vuelve tarea con plazo. En el móvil o la computadora.",
    },
    { t: "Tareas con responsable", d: "Quién hace qué, para cuándo. Cada uno ve su parte." },
    { t: "Recordatorios", d: "Sin cuentas vencidas ni citas perdidas." },
    { t: "Hogar y personal juntos", d: "Súper, cuentas, escuela y citas en un solo lugar." },
    { t: "Comunicación clara", d: "Lo acordado queda registrado — y deja de ser una discusión." },
    { t: "En tu bolsillo", d: "App móvil con la misma cuenta en todos los dispositivos." },
  ],

  howTitle: "Cómo funciona, en 4 pasos",
  howSub: "Tan simple que lo usa toda la familia.",
  steps: [
    { n: "01", t: "Agrega", d: "Suma a los miembros de la familia en segundos." },
    { n: "02", t: "Anota", d: "Captura la tarea por voz o texto." },
    { n: "03", t: "Acuerda", d: "Define quién la hace y para cuándo." },
    { n: "04", t: "Sigue", d: "Mira lo hecho y lo que falta." },
  ],

  authTitle: "De una herramienta de empresa a tu hogar",
  authBody: [
    "appMila empezó ayudando a empresas a no perder tareas. Pero el mismo caos pasa en casa — solo que con la gente que amamos.",
    "Por eso creamos los planes familia: la misma facilidad de capturar por voz y acordar plazos, en un formato simple, sin estructura corporativa, a un precio accesible.",
  ],
  authSignature: "— El equipo de CONNBX, creadores de appMila",

  plansKicker: "Planes familia",
  plansTitle: "Elige según el tamaño de tu familia",
  plansSub: "Suscripción mensual accesible. Cancela cuando quieras.",
  plans: famPlansINTL({
    users: ["hasta 5 personas", "hasta 10 personas"],
    cta: "Empezar con la familia",
    popular: "El favorito de las familias",
    unit: "/mes",
    next: "/es-personal",
  }),
  freeNote: {
    text: "¿Quieres probar sin tarjeta? Empieza con Family Free — 1 persona y hasta 15 tareas por día.",
    cta: "Crear cuenta gratis",
    href: "/start-family-free",
  },

  guaranteeTitle: "Garantía de 7 días",
  guaranteeBody:
    "Úsalo 7 días. Si no encaja con tu familia, devolvemos el 100% — sin complicaciones.",

  faqTitle: "Preguntas frecuentes",
  faqs: [
    {
      q: "¿Cómo funciona el cobro?",
      a: "Una suscripción mensual, procesada de forma segura. Cancela cuando quieras.",
    },
    {
      q: "¿Es difícil de usar?",
      a: "No. Fue hecho para ser simple — agrega personas, anota las tareas y listo. Funciona en el navegador y en el móvil.",
    },
    {
      q: "¿Puedo probarlo gratis?",
      a: "Sí. Family Free permite 1 persona y hasta 15 tareas por día, sin tarjeta.",
    },
    {
      q: "¿Family o Family Plus?",
      a: "Family cubre hasta 5 personas; Family Plus, hasta 10. Lo demás es igual.",
    },
    { q: "¿Puedo cancelar?", a: "Cuando quieras. En los primeros 7 días el reembolso es total." },
  ],

  finalTitle: "Menos reclamos, más armonía en casa",
  finalSub: "Organiza la rutina de tu familia y quítate el peso de encima.",
  finalCta: "Organizar mi familia",

  footerCompany: COMPANY_INTL,
  footerDisclaimer:
    "appMila es software de gestión de tareas y productividad. Pagos procesados de forma segura.",
  privacyLabel: "Política de Privacidad",
  termsLabel: "Seguridad",
  supportEmail: SUPPORT,
};

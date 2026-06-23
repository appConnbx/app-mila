// Supabase Auth "Send Email Hook" — envia os e-mails de autenticação (convite,
// recuperação de senha, etc.) com a marca appMila e NO IDIOMA DA CONTA (holdings.language),
// usando o Resend (FROM no-reply@appmila.co).
//
// Deploy: supabase functions deploy send-email  (ou via MCP)
// Secrets necessários (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY          = re_...            (chave do Resend)
//   SEND_EMAIL_HOOK_SECRET  = v1,whsec_...      (gerado ao habilitar o hook no painel Auth)
//   APP_BASE_URL            = https://www.appmila.co   (opcional; default abaixo)
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente.)
//
// Ativar: Authentication → Hooks → "Send Email" → aponta para esta função.

import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BASE = Deno.env.get("APP_BASE_URL") ?? "https://www.appmila.co";
const FROM = "appMila <no-reply@appmila.co>";

type Lang = "pt-BR" | "en" | "es";

// Descobre o idioma da conta pelo e-mail (fallback pt-BR).
async function accountLanguage(email: string): Promise<Lang> {
  try {
    const url = `${SUPABASE_URL}/rest/v1/people?select=holdings(language)&email=eq.${encodeURIComponent(email)}&limit=1`;
    const res = await fetch(url, {
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
    });
    const rows = (await res.json()) as { holdings?: { language?: string } }[];
    const lang = rows?.[0]?.holdings?.language;
    return lang === "en" || lang === "es" ? lang : "pt-BR";
  } catch {
    return "pt-BR";
  }
}

const COPY: Record<
  Lang,
  Record<"invite" | "recovery" | "generic", { subject: string; body: string; cta: string }>
> = {
  "pt-BR": {
    invite: {
      subject: "Bem-vindo ao appMila — crie sua senha",
      body: "Sua conta no appMila está pronta. Falta só criar sua senha para acessar e começar a organizar suas demandas.",
      cta: "Criar minha senha",
    },
    recovery: {
      subject: "Redefina sua senha do appMila",
      body: "Recebemos um pedido para redefinir sua senha. Clique no botão abaixo para criar uma nova.",
      cta: "Criar nova senha",
    },
    generic: {
      subject: "Acesse sua conta appMila",
      body: "Clique no botão abaixo para continuar o acesso à sua conta appMila.",
      cta: "Acessar minha conta",
    },
  },
  en: {
    invite: {
      subject: "Welcome to appMila — create your password",
      body: "Your appMila account is ready. Just create your password to sign in and start organizing your tasks.",
      cta: "Create my password",
    },
    recovery: {
      subject: "Reset your appMila password",
      body: "We received a request to reset your password. Click the button below to create a new one.",
      cta: "Create new password",
    },
    generic: {
      subject: "Access your appMila account",
      body: "Click the button below to continue accessing your appMila account.",
      cta: "Access my account",
    },
  },
  es: {
    invite: {
      subject: "Bienvenido a appMila — crea tu contraseña",
      body: "Tu cuenta appMila está lista. Solo crea tu contraseña para entrar y empezar a organizar tus tareas.",
      cta: "Crear mi contraseña",
    },
    recovery: {
      subject: "Restablece tu contraseña de appMila",
      body: "Recibimos una solicitud para restablecer tu contraseña. Haz clic abajo para crear una nueva.",
      cta: "Crear nueva contraseña",
    },
    generic: {
      subject: "Accede a tu cuenta appMila",
      body: "Haz clic en el botón de abajo para continuar el acceso a tu cuenta appMila.",
      cta: "Acceder a mi cuenta",
    },
  },
};

const FOOTER: Record<Lang, string> = {
  "pt-BR":
    "Este link é pessoal e expira em algumas horas. Se você não esperava este e-mail, pode ignorá-lo. appMila — gestão de demandas e produtividade · Um produto CONNBX.",
  en: "This link is personal and expires in a few hours. If you didn’t expect this email, you can ignore it. appMila — demand management and productivity · A CONNBX product.",
  es: "Este enlace es personal y caduca en unas horas. Si no esperabas este correo, puedes ignorarlo. appMila — gestión de demandas y productividad · Un producto CONNBX.",
};

function renderHtml(lang: Lang, kind: "invite" | "recovery" | "generic", link: string): string {
  const c = COPY[lang][kind];
  return `<div style="max-width:480px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:#0F172A;padding:22px 28px">
    <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#22D3EE;color:#0F172A;font-weight:bold;text-align:center;line-height:28px">M</span>
    <span style="color:#fff;font-size:18px;font-weight:bold;vertical-align:middle;margin-left:8px">appMila</span>
  </div>
  <div style="padding:28px;background:#fff">
    <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#334155">${c.body}</p>
    <p style="text-align:center;margin:26px 0">
      <a href="${link}" style="display:inline-block;background:#06B6D4;color:#062C33;font-size:15px;font-weight:bold;text-decoration:none;padding:13px 30px;border-radius:8px">${c.cta}</a>
    </p>
    <p style="margin:0 0 22px;font-size:13px;color:#64748B;word-break:break-all">${link}</p>
    <p style="margin:0;font-size:13px;color:#94A3B8;border-top:1px solid #e2e8f0;padding-top:16px">${FOOTER[lang]}</p>
  </div>
</div>`;
}

// email_action_type do Supabase → tipo de e-mail + destino pós-verificação.
function classify(actionType: string): { kind: "invite" | "recovery" | "generic"; next: string } {
  if (actionType === "invite") return { kind: "invite", next: "/create-password" };
  if (actionType === "recovery") return { kind: "recovery", next: "/create-password" };
  return { kind: "generic", next: "/dashboard" };
}

Deno.serve(async (req) => {
  const raw = await req.text();
  // Verifica a assinatura do hook (Standard Webhooks). Secret no formato v1,whsec_...
  let evt: {
    user: { email: string };
    email_data: { token_hash: string; email_action_type: string; redirect_to?: string };
  };
  try {
    const wh = new Webhook(HOOK_SECRET.replace("v1,whsec_", ""));
    evt = wh.verify(raw, Object.fromEntries(req.headers)) as typeof evt;
  } catch {
    return new Response(JSON.stringify({ error: "assinatura inválida" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = evt.user.email;
  const { token_hash, email_action_type } = evt.email_data;
  const { kind, next } = classify(email_action_type);
  const lang = await accountLanguage(email);

  // Link para o nosso /auth/confirm (verifyOtp) → depois cai em /create-password.
  const link = `${BASE}/auth/confirm?token_hash=${encodeURIComponent(token_hash)}&type=${encodeURIComponent(email_action_type)}&next=${encodeURIComponent(next)}&lang=${lang}`;

  const c = COPY[lang][kind];
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      reply_to: "help@appmila.co",
      subject: c.subject,
      html: renderHtml(lang, kind, link),
      // Versão texto (melhora entregabilidade e acessibilidade).
      text: `${c.body}\n\n${c.cta}: ${link}\n\n${FOOTER[lang]}`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return new Response(JSON.stringify({ error: "falha no envio", detail }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

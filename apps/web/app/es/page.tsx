// Landing institucional em espanhol com idioma fixo pela URL (sem cookie) — para
// campanhas de anúncio. Reusa a mesma landing de "/"; o idioma é resolvido pelo
// pathname em i18n/request.ts. Apenas os metadados são localizados aqui.
import type { Metadata } from "next";

export { default } from "../page";

export const metadata: Metadata = {
  title: "appMila — Nunca más pierdas una tarea",
  description:
    "appMila convierte conversaciones, reuniones y decisiones en ejecución organizada — en el trabajo y en casa. Captura, delega, sigue y concluye. Todo en una sola cuenta.",
  alternates: {
    canonical: "https://www.appmila.co/es",
    languages: {
      "pt-BR": "https://www.appmila.co",
      en: "https://www.appmila.co/en",
      es: "https://www.appmila.co/es",
      "x-default": "https://www.appmila.co",
    },
  },
  openGraph: {
    title: "appMila — Nunca más pierdas una tarea",
    description:
      "Captura, delega, sigue y concluye. Tus tareas del trabajo y personales en una sola cuenta.",
    url: "https://www.appmila.co/es",
    siteName: "appMila",
    locale: "es_ES",
    type: "website",
  },
};

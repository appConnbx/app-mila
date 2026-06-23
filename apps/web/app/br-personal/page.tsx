import type { Metadata } from "next";
import { SalesPage } from "../_sales/SalesPage";
import { brPessoal } from "../_sales/content";

export const metadata: Metadata = {
  title: "appMila para Famílias — Combinados claros, casa em harmonia",
  description:
    "Organize a rotina da casa com responsável, prazo e lembrete. Planos família a partir de R$97/ano, com garantia de 7 dias. Teste grátis sem cartão.",
  alternates: {
    canonical: "https://www.appmila.co/br-personal",
    languages: {
      "pt-BR": "https://www.appmila.co/br-personal",
      en: "https://www.appmila.co/en-personal",
      es: "https://www.appmila.co/es-personal",
      "x-default": "https://www.appmila.co/en-personal",
    },
  },
  openGraph: {
    title: "appMila para Famílias — Menos cobrança, mais harmonia",
    description: "Capture por voz, combine quem faz o quê e organize a casa toda. Comece grátis.",
    url: "https://www.appmila.co/br-personal",
    locale: "pt_BR",
    type: "website",
  },
};

export default function Page() {
  return <SalesPage c={brPessoal} />;
}

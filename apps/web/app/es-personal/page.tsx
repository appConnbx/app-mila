import type { Metadata } from "next";
import { SalesPage } from "../_sales/SalesPage";
import { esPersonal } from "../_sales/content";

export const metadata: Metadata = {
  title: "appMila para Familias — Acuerdos claros, un hogar tranquilo",
  description:
    "Organiza el hogar con responsable, plazo y recordatorios. Planes familia con garantía de 7 días. Prueba gratis, sin tarjeta.",
  alternates: {
    canonical: "https://www.appmila.co/es-personal",
    languages: {
      "pt-BR": "https://www.appmila.co/br-personal",
      en: "https://www.appmila.co/en-personal",
      es: "https://www.appmila.co/es-personal",
      "x-default": "https://www.appmila.co/en-personal",
    },
  },
  openGraph: {
    title: "appMila para Familias — Menos reclamos, más armonía",
    description: "Captura por voz, acuerda quién hace qué y organiza toda la casa. Empieza gratis.",
    url: "https://www.appmila.co/es-personal",
    locale: "es_ES",
    type: "website",
  },
};

export default function Page() {
  return <SalesPage c={esPersonal} />;
}

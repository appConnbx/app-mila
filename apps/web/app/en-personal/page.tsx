import type { Metadata } from "next";
import { SalesPage } from "../_sales/SalesPage";
import { enPersonal } from "../_sales/content";

export const metadata: Metadata = {
  title: "appMila for Families — Clear agreements, a calmer home",
  description:
    "Organize the household with an owner, deadline and reminders. Family plans with a 7-day guarantee. Try free, no card required.",
  alternates: {
    canonical: "https://www.appmila.co/en-personal",
    languages: {
      "pt-BR": "https://www.appmila.co/br-personal",
      en: "https://www.appmila.co/en-personal",
      es: "https://www.appmila.co/es-personal",
      "x-default": "https://www.appmila.co/en-personal",
    },
  },
  openGraph: {
    title: "appMila for Families — Less nagging, more harmony",
    description:
      "Capture by voice, agree on who does what, and organize the whole home. Start free.",
    url: "https://www.appmila.co/en-personal",
    locale: "en_US",
    type: "website",
  },
};

export default function Page() {
  return <SalesPage c={enPersonal} />;
}

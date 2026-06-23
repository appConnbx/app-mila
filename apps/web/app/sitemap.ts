import type { MetadataRoute } from "next";
import { POSTS } from "./blog/_posts";

const SITE = "https://www.appmila.co";

// Apenas rotas PÚBLICAS e indexáveis. Não inclui /cbx (secreto), rotas
// autenticadas, /login, /subscribe e /welcome (noindex).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    languages?: Record<string, string>,
  ): MetadataRoute.Sitemap[number] => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
    ...(languages ? { alternates: { languages } } : {}),
  });

  const homeLangs = { "pt-BR": SITE, en: `${SITE}/en`, es: `${SITE}/es` };
  const bizLangs = {
    "pt-BR": `${SITE}/br-business`,
    en: `${SITE}/en-business`,
    es: `${SITE}/es-business`,
  };
  const perLangs = {
    "pt-BR": `${SITE}/br-personal`,
    en: `${SITE}/en-personal`,
    es: `${SITE}/es-personal`,
  };

  return [
    entry("", 1, "weekly", homeLangs),
    entry("/en", 0.9, "weekly"),
    entry("/es", 0.9, "weekly"),
    // Páginas de venda por contexto (empresas / família) × idioma — com hreflang.
    entry("/br-business", 0.8, "monthly", bizLangs),
    entry("/en-business", 0.8, "monthly", bizLangs),
    entry("/es-business", 0.8, "monthly", bizLangs),
    entry("/br-personal", 0.8, "monthly", perLangs),
    entry("/en-personal", 0.8, "monthly", perLangs),
    entry("/es-personal", 0.8, "monthly", perLangs),
    // Programa de afiliados (recrutamento) + blog (conteúdo).
    entry("/affiliates", 0.7, "monthly"),
    entry("/blog", 0.7, "weekly"),
    ...POSTS.map((p) => entry(`/blog/${p.slug}`, 0.6, "monthly")),
    // Institucionais / conversão.
    entry("/start", 0.6, "monthly"),
    entry("/start-family-free", 0.6, "monthly"),
    entry("/privacy", 0.3, "yearly"),
    entry("/security", 0.3, "yearly"),
    entry("/terms", 0.3, "yearly"),
  ];
}

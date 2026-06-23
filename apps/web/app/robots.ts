import type { MetadataRoute } from "next";

const SITE = "https://www.appmila.co";

// IMPORTANTE: NÃO listar /cbx aqui — citá-lo no robots revelaria o portal
// secreto. O /cbx já é protegido por noindex + 404 para não-staff. Bloqueamos
// só a API; as rotas autenticadas redirecionam para /login e não indexam.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}

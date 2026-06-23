import { Aurora } from "@/components/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "./_posts";

export const metadata: Metadata = {
  title: "Blog do appMila — produtividade, demandas e organização",
  description:
    "Artigos sobre como organizar tarefas (por voz), não perder demandas no trabalho e na família, e executar o que foi combinado.",
  alternates: { canonical: "https://www.appmila.co/blog" },
  openGraph: {
    type: "website",
    title: "Blog do appMila",
    description: "Produtividade, gestão de demandas e organização — trabalho e família.",
    url: "https://www.appmila.co/blog",
    siteName: "appMila",
    locale: "pt_BR",
  },
};

export default function BlogIndex() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-200">
      <Aurora />
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-slate-950">
              M
            </span>
            <span className="font-bold text-white">appMila</span>
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Início
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Blog</h1>
        <p className="mt-2 text-slate-400">
          Produtividade, gestão de demandas e organização — no trabalho e em casa.
        </p>

        <div className="mt-8 space-y-4">
          {POSTS.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-brand/40"
            >
              <p className="text-xs text-brand">
                {p.tag} · {p.dateLabel}
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">{p.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

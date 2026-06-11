import { NextResponse } from 'next/server'

// Redireciona para o instalador Windows da release mais recente do agente.
// O nome do asset muda a cada versão (contém o número), então resolvemos via
// API do GitHub com cache — o link /api/agent/download é estável para sempre.
export const revalidate = 900

const RELEASES_PAGE = 'https://github.com/appConnbx/app-mila/releases/latest'

export async function GET() {
  try {
    const res = await fetch('https://api.github.com/repos/appConnbx/app-mila/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 900 },
    })
    if (res.ok) {
      const rel = (await res.json()) as { assets?: { name?: string; browser_download_url?: string }[] }
      const asset = (rel.assets ?? []).find((a) => a.name?.endsWith('-setup.exe'))
      if (asset?.browser_download_url) {
        return NextResponse.redirect(asset.browser_download_url, 302)
      }
    }
  } catch {
    // API fora do ar / rate limit: cai no fallback abaixo.
  }
  return NextResponse.redirect(RELEASES_PAGE, 302)
}

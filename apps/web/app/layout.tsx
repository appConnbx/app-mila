import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MILA',
  description: 'Gestão de demandas, eventos e produtividade',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Tema vem do cookie (padrão: escuro). Renderizado no servidor → sem flash.
  const theme = (await cookies()).get('mila_theme')?.value === 'light' ? 'light' : ''
  return (
    <html lang="pt-BR" className={theme}>
      <body className={inter.className}>
        <NextTopLoader
          color="#22D3EE"
          height={3}
          showSpinner={true}
          shadow="0 0 10px #22D3EE,0 0 5px #22D3EE"
          crawlSpeed={120}
          speed={250}
        />
        {children}
      </body>
    </html>
  )
}

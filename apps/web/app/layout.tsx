import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MILA',
  description: 'Gestão de demandas, eventos e produtividade',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
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

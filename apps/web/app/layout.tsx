import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}

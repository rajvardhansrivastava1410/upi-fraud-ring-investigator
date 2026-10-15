import type { Metadata } from 'next'
import '@/index.css'

export const metadata: Metadata = {
  title: 'TRACE | Autonomous Graph Anomaly & Ring Inference Engine',
  description:
    'Synthetic-data-only explainable graph anomaly and fraud-ring investigation workspace.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}

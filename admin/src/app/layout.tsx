import type { Metadata } from 'next'
import './globals.css'
import { ColorSchemeScript } from '@mantine/core'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Mini Host Catalog — 后台管理',
  description: '产品管理、数据分析、客户线索后台系统',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

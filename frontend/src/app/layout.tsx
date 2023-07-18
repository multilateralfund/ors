import { Inter } from 'next/font/google'

import { Header } from '@ors/components/theme/Header/Header'
import '@ors/theme/global.css'

import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ORS',
  description:
    'Multilateral Fund for the Implementation of the Montreal Protocol',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} id="__next">
        <Header />
        {/* {children} */}
      </body>
    </html>
  )
}

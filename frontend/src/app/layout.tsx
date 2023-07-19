import { Inter } from 'next/font/google'
import React from 'react'

import GuardRoutes from '@ors/components/theme/GuardRoutes/GuardRoutes'
import Header from '@ors/components/theme/Header/Header'
import Sidebar from '@ors/components/theme/Sidebar/Sidebar'
import api from '@ors/helpers/Api/Api'
import { Provider } from '@ors/store'
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
  const user = await api('api/auth/user/', {}, false)

  return (
    <html lang="en">
      <body className={inter.className} id="__next">
        <Provider initialState={{ user: { data: user } }}>
          <GuardRoutes />
          <Header />
          <main className="flex w-full">
            <Sidebar />
            {children}
          </main>
        </Provider>
      </body>
    </html>
  )
}

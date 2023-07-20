import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import React from 'react'

import GuardRoutes from '@ors/components/theme/GuardRoutes/GuardRoutes'
import View from '@ors/components/theme/Views/View'
import api from '@ors/helpers/Api/Api'
import { Provider } from '@ors/store'
import ThemeProvider from '@ors/theme/ThemeProvider'

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
  const theme = cookies().get('theme') || { value: null }

  return (
    <html lang="en" {...(theme.value ? { 'data-mode': theme.value } : {})}>
      <body className={inter.className}>
        <div id="__next">
          <Provider initialState={{ theme: theme.value, user: { data: user } }}>
            <ThemeProvider>
              <GuardRoutes />
              <View>{children}</View>
            </ThemeProvider>
          </Provider>
        </div>
      </body>
    </html>
  )
}

import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import React from 'react'

import GuardRoutes from '@ors/components/theme/GuardRoutes/GuardRoutes'
import View from '@ors/components/theme/Views/View'
import api from '@ors/helpers/Api/Api'
import { getInitialSliceData } from '@ors/helpers/Store/Store'
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
  let blends, countries, substances, usages
  const user = await api('api/auth/user/', {}, false)
  const theme = cookies().get('theme') || { value: null }

  if (user) {
    blends = await api('api/blends/', {}, false)
    countries = await api('api/countries/', {}, false)
    substances = await api('api/substances/', {}, false)
    usages = await api('api/usages/', {}, false)
  }

  return (
    <html lang="en" {...(theme.value ? { 'data-mode': theme.value } : {})}>
      <body className={inter.className}>
        <div id="__next">
          <Provider
            initialState={{
              theme: theme.value,
              user: { data: user },
              reports: {
                blends: {
                  get: getInitialSliceData(blends),
                },
                substances: {
                  get: getInitialSliceData(substances),
                },
                countries: {
                  get: getInitialSliceData(countries),
                },
                usages: {
                  get: getInitialSliceData(usages),
                },
              },
            }}
          >
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

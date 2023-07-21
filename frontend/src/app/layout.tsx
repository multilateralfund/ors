import type { Metadata } from 'next'

import React from 'react'

import { cookies } from 'next/headers'

import GuardRoutes from '@ors/components/theme/GuardRoutes/GuardRoutes'
import View from '@ors/components/theme/Views/View'
import api from '@ors/helpers/Api/Api'
import { getInitialSliceData } from '@ors/helpers/Store/Store'
import { Provider } from '@ors/store'
import ThemeProvider from '@ors/theme/ThemeProvider'

import '@ors/theme/global.css'

export const metadata: Metadata = {
  description:
    'Multilateral Fund for the Implementation of the Montreal Protocol',
  title: 'ORS',
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
      <body>
        <div id="next-app">
          <Provider
            initialState={{
              reports: {
                blends: {
                  get: getInitialSliceData(blends),
                },
                countries: {
                  get: getInitialSliceData(countries),
                },
                substances: {
                  get: getInitialSliceData(substances),
                },
                usages: {
                  get: getInitialSliceData(usages),
                },
              },
              theme: theme.value,
              user: { data: user },
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

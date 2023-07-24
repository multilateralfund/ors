/* eslint-disable @next/next/no-css-tags */
import type { Metadata } from 'next'

import React from 'react'

import { Roboto } from 'next/font/google'
import { cookies as nextCookies, headers as nextHeaders } from 'next/headers'

import { Header, View } from '@ors/components'
import { api, getCurrentView, getInitialSliceData } from '@ors/helpers'
import { Provider as StoreProvider } from '@ors/store'
import ThemeProvider from '@ors/themes/ThemeProvider'

import '@ors/themes/styles/global.css'

const roboto = Roboto({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
})

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
  const cookies = nextCookies()
  const headers = nextHeaders()
  let blends, countries, substances, usages
  const pathname = headers.get('x-next-pathname')
  const theme = cookies.get('theme') || { value: null }
  const currentView = getCurrentView(pathname || '')

  const user = await api('api/auth/user/', {}, false)

  if (user) {
    blends = await api('api/blends/', {}, false)
    countries = await api('api/countries/', {}, false)
    substances = await api('api/substances/', {}, false)
    usages = await api('api/usages/', {}, false)
  }

  return (
    <html
      lang="en"
      {...(theme.value ? { 'data-mode': theme.value } : {})}
      data-layout={currentView.layout}
    >
      <body className={roboto.className}>
        <div id="next-app">
          <StoreProvider
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
            <ThemeProvider options={{ key: 'tw', prepend: true }}>
              <Header />
              <View>{children}</View>
            </ThemeProvider>
          </StoreProvider>
        </div>
        <noscript>
          <link href="/no-script.css" rel="stylesheet" type="text/css" />
        </noscript>
      </body>
    </html>
  )
}

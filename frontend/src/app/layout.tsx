/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @next/next/no-css-tags */
import type { Metadata } from 'next'

import React from 'react'

import { dir } from 'i18next'
import { Roboto } from 'next/font/google'
import { cookies as nextCookies, headers as nextHeaders } from 'next/headers'

import { Header, View } from '@ors/components'
import { api, getCurrentView, getInitialSliceData } from '@ors/helpers'
import config from '@ors/registry'
import { Provider as StoreProvider } from '@ors/store'
import ThemeProvider from '@ors/themes/ThemeProvider'
import { Language } from '@ors/types/locales'

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
  const lang = (headers.get('x-next-lang') ||
    config.i18n.defaultLanguage) as Language
  const theme = cookies.get(config.cookies.theme) || { value: null }
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
      lang={lang}
      {...(theme.value ? { 'data-mode': theme.value } : {})}
      data-layout={currentView?.layout}
      dir={dir(lang)}
    >
      <body className={roboto.className}>
        <div id="next-app">
          <StoreProvider
            initialState={{
              i18n: {
                lang,
              },
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
              theme: {
                mode: theme.value as 'dark' | 'light' | null,
              },
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

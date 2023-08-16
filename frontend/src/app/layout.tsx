/* eslint-disable @next/next/no-before-interactive-script-outside-document */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @next/next/no-css-tags */
import type { Metadata } from 'next'

import React from 'react'

import { dir } from 'i18next'
import { Roboto } from 'next/font/google'
import { cookies as nextCookies, headers as nextHeaders } from 'next/headers'
import Script from 'next/script'

import Header from '@ors/components/theme/Header/Header'
import View from '@ors/components/theme/Views/View'
import api from '@ors/helpers/Api/Api'
import { getInitialSliceData } from '@ors/helpers/Store/Store'
import { getCurrentView } from '@ors/helpers/View/View'
import config from '@ors/registry'
import { CommonSlice } from '@ors/slices/createCommonSlice'
import { ProjectsSlice } from '@ors/slices/createProjectSlice'
import { ReportsSlice } from '@ors/slices/createReportsSlice'
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

async function getInitialProjectsData(): Promise<ProjectsSlice> {
  const statuses = api('api/project-statuses/', {}, false)
  const sectors = api('api/project-sectors/', {}, false)
  const subsectors = api('api/project-subsectors/', {}, false)
  const types = api('api/project-types/', {}, false)
  const meetings = api('api/project-meetings/', {}, false)

  return {
    meetings: getInitialSliceData(await meetings),
    sectors: getInitialSliceData(await sectors),
    statuses: getInitialSliceData(await statuses),
    subsectors: getInitialSliceData(await subsectors),
    types: getInitialSliceData(await types),
  }
}

async function getInitialReportsData(): Promise<ReportsSlice> {
  const blends = api('api/blends/', {}, false)
  const substances = api('api/substances/', {}, false)
  const usages = api('api/usages/', {}, false)

  return {
    blends: {
      get: getInitialSliceData(await blends),
    },
    get: getInitialSliceData(null),
    substances: {
      get: getInitialSliceData(await substances),
    },
    usages: {
      get: getInitialSliceData(await usages),
    },
  }
}

async function getInitialCommonData(): Promise<CommonSlice> {
  const agencies = api('api/agencies/', {}, false)
  const countries = api('api/countries/', {}, false)
  const settings = api('api/settings/', {}, false)

  return {
    agencies: getInitialSliceData(await agencies),
    countries: getInitialSliceData(await countries),
    settings: getInitialSliceData(await settings),
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookies = nextCookies()
  const headers = nextHeaders()
  let user
  let reports, projects, common
  const pathname = headers.get('x-next-pathname')
  const lang = (headers.get('x-next-lang') ||
    config.i18n.defaultLanguage) as Language
  const theme = cookies.get(config.cookies.theme) || { value: null }
  const currentView = getCurrentView(pathname || '')

  if (pathname !== '/econnrefused') {
    user = await api('api/auth/user/', {}, false)
  }

  if (user) {
    projects = await getInitialProjectsData()
    reports = await getInitialReportsData()
    common = await getInitialCommonData()
  }

  return (
    <html
      lang={lang}
      {...(theme.value ? { 'data-theme': theme.value } : {})}
      data-layout={currentView?.layout}
      data-ssr="yes"
      dir={dir(lang)}
    >
      <body className={roboto.className}>
        <Script src="/critical.js" strategy="beforeInteractive" />
        <div id="next-app">
          <StoreProvider
            initialState={{
              common,
              i18n: {
                lang,
              },
              projects,
              reports,
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

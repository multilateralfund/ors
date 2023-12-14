/* eslint-disable @next/next/no-before-interactive-script-outside-document */
/* eslint-disable @next/next/no-css-tags */
import type { Metadata } from 'next'

import React from 'react'

import { dir } from 'i18next'
// import { includes } from 'lodash'
import { Roboto } from 'next/font/google'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cookies as nextCookies, headers as nextHeaders } from 'next/headers'
import Script from 'next/script'

import View from '@ors/components/theme/Views/View'
// import config from '@ors/config/base'
import api from '@ors/helpers/Api/Api'
import { getInitialSliceData } from '@ors/helpers/Store/Store'
import { getCurrentView } from '@ors/helpers/View/View'
import { StoreProvider } from '@ors/store'
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
  // const cookies = nextCookies()
  const headers = nextHeaders()
  let user, internalError
  let cp_reports, projects, common, businessPlans
  const pathname = headers.get('x-next-pathname')
  // const lang = (headers.get('x-next-lang') ||
  //   config.i18n.defaultLanguage) as Language
  const lang = 'en'
  // const theme = cookies.get(config.cookies.theme) || { value: null }
  const theme = { value: 'light' }
  const currentView = getCurrentView(pathname || '')

  try {
    user = await api('api/auth/user/', {})
  } catch (error) {
    // if (
    //   error &&
    //   includes(
    //     [undefined, 'TypeError', 'ECONNREFUSED'],
    //     error.status || error.name,
    //   )
    // ) {
    //   internalError = {
    //     _info: error,
    //     status: 'ECONNREFUSED',
    //   }
    // }
  }

  if (user) {
    const [
      // Common data
      settings,
      agencies,
      countries,
      // Projects data
      statuses,
      sectors,
      subsectors,
      types,
      meetings,
      clusters,
      // Country programme data
      blends,
      substances,
      // Business Plans
      yearRanges,
    ] = await Promise.all([
      api('api/settings/', {}, false),
      api('api/agencies/', {}, false),
      api('api/countries/', {}, false),
      api('api/project-statuses/', {}, false),
      api('api/project-sectors/', {}, false),
      api('api/project-subsectors/', {}, false),
      api('api/project-types/', {}, false),
      api('api/project-meetings/', {}, false),
      api('api/project-clusters/', {}, false),
      api('api/blends/', { params: { with_usages: true } }, false),
      api('api/substances/', { params: { with_usages: true } }, false),
      // api('api/usages/', {}, false),
      api('api/business-plan/get-years/', {}, false),
    ])

    common = {
      agencies: getInitialSliceData(agencies),
      countries: getInitialSliceData(countries),
      settings: getInitialSliceData(settings),
    }
    projects = {
      clusters: getInitialSliceData(clusters),
      meetings: getInitialSliceData(meetings),
      sectors: getInitialSliceData(sectors),
      statuses: getInitialSliceData(statuses),
      subsectors: getInitialSliceData(subsectors),
      types: getInitialSliceData(types),
    }
    cp_reports = {
      blends: getInitialSliceData(blends),
      substances: getInitialSliceData(substances),
    }
    businessPlans = {
      sectors: getInitialSliceData(sectors),
      subsectors: getInitialSliceData(subsectors),
      types: getInitialSliceData(types),
      yearRanges: getInitialSliceData(yearRanges),
    }
  }

  return (
    <html
      lang={lang}
      {...(theme.value ? { 'data-theme': theme.value } : {})}
      data-layout={currentView?.layout}
      data-printing="no"
      data-ssr="yes"
      dir={dir(lang)}
    >
      <body id="next-app" className={roboto.className}>
        <Script src="/critical.js" strategy="beforeInteractive" />
        <StoreProvider
          initialState={{
            businessPlans,
            common,
            cp_reports,
            i18n: {
              lang,
            },
            internalError,
            projects,
            theme: {
              mode: theme.value as 'dark' | 'light' | null,
            },
            user: { data: user, loaded: !!user },
          }}
        >
          <ThemeProvider options={{ key: 'tw', prepend: true }}>
            <View>{children}</View>
          </ThemeProvider>
        </StoreProvider>
        <noscript>
          <link href="/no-script.css" rel="stylesheet" type="text/css" />
        </noscript>
      </body>
    </html>
  )
}

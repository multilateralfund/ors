/* eslint-disable @next/next/no-before-interactive-script-outside-document */
import { ApiBlend } from '@ors/types/api_blends'
import { ApiSubstance } from '@ors/types/api_substances'
import { Country } from '@ors/types/store'
/* eslint-disable @next/next/no-css-tags */
import type { Metadata } from 'next'

import React from 'react'

// import { includes } from 'lodash'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import Script from 'next/script'

import View from '@ors/components/theme/Views/View'
// import config from '@ors/config/base'
import api from '@ors/helpers/Api/_api'
import { getInitialSliceData } from '@ors/helpers/Store/Store'
import { getCurrentView } from '@ors/helpers/View/View'
import { StoreProvider } from '@ors/store'
import ThemeProvider from '@ors/themes/ThemeProvider'
import { robotoCondensed } from '@ors/themes/fonts'

import '@ors/themes/styles/global.css'

export const metadata: Metadata = {
  description:
    'Multilateral Fund for the Implementation of the Montreal Protocol',
  title: 'KMS',
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
  const host = headers.get('x-next-host')
  const protocol = headers.get('x-next-protocol')
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
      commentTypes,
    ] = await Promise.all([
      api('api/settings/', {}, false),
      api('api/agencies/', {}, false),
      api('api/countries/', {}, false),
      api('api/project-statuses/', {}, false),
      api('api/project-sector/', {}, false),
      api('api/project-subsector/', {}, false),
      api('api/project-types/', {}, false),
      api('api/meetings/', {}, false),
      api('api/project-clusters/', {}, false),
      api(
        'api/blends/',
        { params: { with_alt_names: true, with_usages: true } },
        false,
      ),
      api(
        'api/substances/',
        { params: { with_alt_names: true, with_usages: true } },
        false,
      ),
      // api('api/usages/', {}, false),
      api('api/comment-types/', {}, false),
    ])

    common = {
      agencies: getInitialSliceData(agencies),
      countries: getInitialSliceData<Country[]>(countries),
      countries_for_create: getInitialSliceData<Country[]>(
        countries.filter((c: Country) => c.has_cp_report && !c.is_a2),
      ),
      countries_for_listing: getInitialSliceData<Country[]>(
        countries.filter((c: Country) => c.has_cp_report),
      ),
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
      blends: getInitialSliceData<ApiBlend[]>(blends),
      substances: getInitialSliceData<ApiSubstance[]>(substances),
    }
    businessPlans = {
      commentTypes: getInitialSliceData(commentTypes),
      sectors: getInitialSliceData(sectors),
      subsectors: getInitialSliceData(subsectors),
      types: getInitialSliceData(types),
    }
  } else if (currentView.layout === 'authorized_document') {
    redirect('/login')
  }

  return (
    <html
      lang="en"
      {...(theme.value ? { 'data-theme': theme.value } : {})}
      className={`${robotoCondensed.className} ${robotoCondensed.variable}`}
      data-layout={currentView?.layout}
      data-printing="no"
      data-ssr="yes"
    >
      <body id="next-app">
        <div id="layout" className={'h-full'}>
          <Script src="/critical.js" strategy="beforeInteractive" />
          <StoreProvider
            initialState={{
              businessPlans,
              common,
              cp_reports,
              internalError,
              projects,
              settings: {
                host,
                protocol,
              },
              theme: {
                mode: theme.value as 'dark' | 'light' | null,
              },
              user: { data: user, loaded: !!user },
            }}
          >
            <ThemeProvider
              options={{
                enableCssLayer: true,
                prepend: true,
                speedy: true,
              }}
            >
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

import type { ApiAgency } from '@ors/@types/api_agencies'
import { ApiBlend } from '@ors/types/api_blends'
import { ApiSubstance } from '@ors/types/api_substances'
import { Country } from '@ors/types/store'

import React, { useMemo, useState, useEffect } from 'react'

import { useStore } from '@ors/store'

import cx from 'classnames'

import { useLocation, useSearch } from 'wouter'

import View from '@ors/components/theme/Views/View'
// import View from '../components/theme/Views/View'
import api from '@ors/helpers/Api/_api'
import { getInitialSliceData, setSlice } from '@ors/helpers/Store/Store'
import { getCurrentView } from '@ors/helpers/View/View'
import { StoreProvider } from '@ors/store'
import ThemeProvider from '@ors/themes/ThemeProvider'
import useSearchParams from '@ors/hooks/useSearchParams'
import { UpdatedFieldsProvider } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PermissionsProvider from '../contexts/PermissionsProvider'

import '../themes/styles/global.css'
import { ProjectStatusType } from '@ors/types/api_project_statuses.ts'
import { ProjectSectorType } from '@ors/types/api_project_sector.ts'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector.ts'
import { ProjectSubmissionStatusType } from '@ors/types/api_project_submission_statuses.ts'
import { ProjectSubstancesGroupsType } from '@ors/types/api_project_substances_groups'

import { scopes } from '@ors/config/msalConfig'
import { useMsal } from '@azure/msal-react'
import Cookies from 'js-cookie'

async function fetchAppBootstrapData() {
  const [
    // Common data
    settings,
    user_permissions,
    agencies,
    countries,
    // Projects data
    statuses,
    submission_statuses,
    sectors,
    subsectors,
    types,
    meetings,
    decisions,
    clusters,
    substances_groups,
    // Country programme data
    blends,
    substances,
  ] = await Promise.all([
    api('api/settings/', {}, false),
    api('api/user/permissions/', {}, false),
    api(
      'api/agencies/',
      { params: { include_all_agencies_option: true } },
      false,
    ),
    api('api/countries/', {}, false),
    api('api/project-statuses/', {}, false),
    api('api/project-submission-statuses/', {}, false),
    api('api/project-sector/', {}, false),
    api('api/project-subsector/', {}, false),
    api('api/project-types/', {}, false),
    api('api/meetings/', {}, false),
    api('api/decisions/', {}, false),
    api('api/project-clusters/', {}, false),
    api('api/groups/', {}, false),
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
  ])

  return {
    businessPlans: {
      decisions: getInitialSliceData(decisions),
      sectors: getInitialSliceData(sectors),
      subsectors: getInitialSliceData(subsectors),
      types: getInitialSliceData(types),
    },
    common: {
      agencies: getInitialSliceData(
        agencies.filter((a: ApiAgency) => a.name !== 'All agencies'),
      ),
      agencies_with_all: getInitialSliceData(agencies),
      countries: getInitialSliceData<Country[]>(countries),
      countries_for_create: getInitialSliceData<Country[]>(
        countries.filter((c: Country) => c.has_cp_report && !c.is_a2),
      ),
      countries_for_listing: getInitialSliceData<Country[]>(
        countries.filter((c: Country) => c.has_cp_report),
      ),
      settings: getInitialSliceData(settings),
      user_permissions: getInitialSliceData(user_permissions),
    },
    cp_reports: {
      blends: getInitialSliceData<ApiBlend[]>(blends),
      substances: getInitialSliceData<ApiSubstance[]>(substances),
    },
    projects: {
      clusters: getInitialSliceData(clusters),
      meetings: getInitialSliceData(meetings),
      sectors: getInitialSliceData<ProjectSectorType[]>(sectors),
      statuses: getInitialSliceData<ProjectStatusType[]>(statuses),
      submission_statuses:
        getInitialSliceData<ProjectSubmissionStatusType[]>(submission_statuses),
      subsectors: getInitialSliceData<ProjectSubSectorType[]>(subsectors),
      substances_groups:
        getInitialSliceData<ProjectSubstancesGroupsType[]>(substances_groups),
      types: getInitialSliceData(types),
    },
  }
}

function setAppBootstrapData(
  appData: Awaited<ReturnType<typeof fetchAppBootstrapData>>,
) {
  setSlice('businessPlans', appData.businessPlans)
  setSlice('common', appData.common)
  setSlice('cp_reports', appData.cp_reports)
  setSlice('projects', appData.projects)
}

function useAppBootstrap(userId?: number) {
  const [bootstrappedUserId, setBootstrappedUserId] = useState<null | number>(
    null,
  )

  useEffect(
    function () {
      let ignore = false

      async function bootstrapAppData() {
        const appData = await fetchAppBootstrapData()

        if (!ignore) {
          setAppBootstrapData(appData)
          setBootstrappedUserId(userId ?? null)
        }
      }

      if (!userId) {
        setBootstrappedUserId(null)
        return
      }

      setBootstrappedUserId(null)
      bootstrapAppData()

      return () => {
        ignore = true
      }
    },
    [userId],
  )

  return !!userId && bootstrappedUserId === userId
}

function getCurrentPath(pathname: string, search: string) {
  return `${pathname || '/'}${search ? `?${search}` : ''}`
}

function getLoginPath(pathname: string, search: string) {
  const redirectPath = getCurrentPath(pathname, search)

  return redirectPath !== '/'
    ? `/login?redirect=${encodeURIComponent(redirectPath)}`
    : '/login'
}

function getPostLoginPath(searchParams: URLSearchParams) {
  const redirectPath = searchParams.get('redirect')

  if (
    redirectPath &&
    redirectPath.startsWith('/') &&
    !redirectPath.startsWith('//') &&
    redirectPath !== '/login' &&
    !redirectPath.startsWith('/login?')
  ) {
    return redirectPath
  }

  return '/'
}

function ClientAppGate({ children }: { children: React.ReactNode }) {
  const [pathname, setLocation] = useLocation()
  const search = useSearch()
  const searchParams = useSearchParams()
  const user = useStore((state) => state.user)
  const getUser = useStore((state) => state.user.getUser)
  const appBootstrapped = useAppBootstrap(user.data?.pk)
  const { instance } = useMsal()

  const currentView = getCurrentView(pathname || '')
  const isLoginPath = pathname === '/login'
  const isProtectedPath =
    currentView.layout === 'authorized_document' ||
    currentView.layout === 'print'

  useEffect(() => {
    getUser()
  }, [getUser])

  useEffect(() => {
    if (!user.loaded) {
      return
    }

    if (isLoginPath && user.data) {
      setLocation(getPostLoginPath(searchParams), { replace: true })
      return
    }

    if (isProtectedPath && !user.data) {
      setLocation(getLoginPath(pathname, search), { replace: true })
    }
  }, [
    isLoginPath,
    isProtectedPath,
    pathname,
    search,
    searchParams,
    setLocation,
    user.data,
    user.loaded,
  ])

  const shouldRenderView = useMemo(
    function () {
      if (!user.loaded) {
        return false
      }

      if (isLoginPath && user.data) {
        return false
      }

      if (isProtectedPath) {
        return Boolean(user.data && appBootstrapped)
      }

      return true
    },
    [appBootstrapped, isLoginPath, isProtectedPath, user.data, user.loaded],
  )

  useEffect(() => {
    const initializeUser = async () => {
      const authToken = Cookies.get('orsauth')

      if (!authToken) {
        const account =
          instance.getActiveAccount() || instance.getAllAccounts()[0]

        if (account) {
          const token = await instance.acquireTokenSilent({ account, scopes })

          await api('/api/auth/adfs-login/', {
            headers: { Authorization: `Bearer ${token.accessToken}` },
            method: 'POST',
          })
        }
      }
    }

    initializeUser().catch(console.error)
  }, [instance])

  return <View>{shouldRenderView ? children : null}</View>
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const cookies = nextCookies()
  const theme = { value: 'light' }

  return (
    <div id="layout" className={cx('h-full')}>
      <StoreProvider
        initialState={{
          theme: {
            mode: theme.value as 'dark' | 'light' | null,
          },
        }}
      >
        <ThemeProvider>
          <PermissionsProvider>
            <UpdatedFieldsProvider>
              <ClientAppGate>{children}</ClientAppGate>
            </UpdatedFieldsProvider>
          </PermissionsProvider>
        </ThemeProvider>
      </StoreProvider>
    </div>
  )
}

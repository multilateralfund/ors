import { ApiUser } from '@ors/types/api_auth_user'
import { ApiBlend } from '@ors/types/api_blends'
import { ApiSubstance } from '@ors/types/api_substances'
import { Country } from '@ors/types/store'

import React, { useMemo, useState, useEffect } from 'react'

import { useStore } from '@ors/store'

import cx from 'classnames'

import { useLocation } from 'wouter'

import View from '@ors/components/theme/Views/View'
// import View from '../components/theme/Views/View'
import api from '@ors/helpers/Api/_api'
import { getInitialSliceData } from '@ors/helpers/Store/Store'
import { getCurrentView } from '@ors/helpers/View/View'
import { StoreProvider } from '@ors/store'
import ThemeProvider from '@ors/themes/ThemeProvider'
import useSearchParams from '@ors/hooks/useSearchParams'
import PermissionsProvider from '../contexts/PermissionsProvider'

import '../themes/styles/global.css'
import { ProjectStatusType } from '@ors/types/api_project_statuses.ts'
import { ProjectSectorType } from '@ors/types/api_project_sector.ts'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector.ts'
import { ProjectSubmissionStatusType } from '@ors/types/api_project_submission_statuses.ts'
import { ProjectSubstancesGroupsType } from '@ors/types/api_project_substances_groups'

function useUser() {
  const [userData, setUserData] = useState<{
    loaded: boolean
    user?: null | ApiUser
  }>({ loaded: false, user: null })

  useEffect(function () {
    async function fetchUser() {
      try {
        const apiUser = await api<ApiUser>('api/auth/user/', {})
        setUserData({ loaded: true, user: apiUser })
      } catch (error) {
        setUserData({ loaded: true, user: null })
      }
    }
    fetchUser()
  }, [])

  return userData
}

function useAppState(user: ApiUser | null | undefined) {
  const [state, setState] = useState<any>(null)

  useEffect(
    function () {
      async function fetchState() {
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
          api('api/agencies/', {}, false),
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

        const common = {
          agencies: getInitialSliceData(agencies),
          countries: getInitialSliceData<Country[]>(countries),
          countries_for_create: getInitialSliceData<Country[]>(
            countries.filter((c: Country) => c.has_cp_report && !c.is_a2),
          ),
          countries_for_listing: getInitialSliceData<Country[]>(
            countries.filter((c: Country) => c.has_cp_report),
          ),
          settings: getInitialSliceData(settings),
          user_permissions: getInitialSliceData(user_permissions),
        }
        const projects = {
          clusters: getInitialSliceData(clusters),
          meetings: getInitialSliceData(meetings),
          sectors: getInitialSliceData<ProjectSectorType[]>(sectors),
          statuses: getInitialSliceData<ProjectStatusType[]>(statuses),
          submission_statuses:
            getInitialSliceData<ProjectSubmissionStatusType[]>(
              submission_statuses,
            ),
          subsectors: getInitialSliceData<ProjectSubSectorType[]>(subsectors),
          types: getInitialSliceData(types),
          substances_groups:
            getInitialSliceData<ProjectSubstancesGroupsType[]>(
              substances_groups,
            ),
        }
        const cp_reports = {
          blends: getInitialSliceData<ApiBlend[]>(blends),
          substances: getInitialSliceData<ApiSubstance[]>(substances),
        }
        const businessPlans = {
          sectors: getInitialSliceData(sectors),
          subsectors: getInitialSliceData(subsectors),
          types: getInitialSliceData(types),
          decisions: getInitialSliceData(decisions),
        }

        setState({ common, projects, cp_reports, businessPlans })
      }

      if (user) {
        fetchState()
      }
    },
    [user],
  )

  return state
}

function LoginWrapper(props: any) {
  const { appState, children, setCurrentUser } = props
  const [pathname] = useLocation()
  const user = useStore((state) => state.user)

  useEffect(() => {
    setCurrentUser(user)
  }, [user])

  const currentView = getCurrentView(pathname || '')

  const shouldRenderView = useMemo(
    function () {
      const isAuthorized = currentView.layout === 'authorized_document'
      const haveUser = user.loaded && user.data && appState
      const unauthenticatedPath = user.loaded && !user.data && !isAuthorized
      return haveUser || unauthenticatedPath
    },
    [user.loaded, user.data, appState, currentView.layout],
  )

  return <View>{shouldRenderView ? children : null}</View>
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const cookies = nextCookies()
  const [pathname, setLocation] = useLocation()
  const searchParams = useSearchParams()
  const theme = { value: 'light' }

  const { user, loaded: userLoaded } = useUser()
  const appState = useAppState(user)
  const [currentUser, setCurrentUser] = useState<any>()

  useEffect(() => {
    const isLoginPath = pathname === '/login'
    if (user && currentUser?.data && currentUser?.loaded && isLoginPath) {
      setTimeout(() => {
        setLocation(searchParams.get('redirect') || '/')
      }, 500)
    }
  }, [user, pathname, userLoaded, setLocation, searchParams, currentUser])

  return (
    <div id="layout" className={cx('h-full')}>
      <StoreProvider
        initialState={{
          ...appState,
          theme: {
            mode: theme.value as 'dark' | 'light' | null,
          },
          user: { data: user, loaded: userLoaded },
        }}
      >
        <ThemeProvider>
          <LoginWrapper appState={appState} setCurrentUser={setCurrentUser}>
            <PermissionsProvider>{children}</PermissionsProvider>
          </LoginWrapper>
        </ThemeProvider>
      </StoreProvider>
    </div>
  )
}

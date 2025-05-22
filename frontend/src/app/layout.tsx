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
import {
  getInitialSliceData,
  fetchSliceData,
  setSlice,
} from '@ors/helpers/Store/Store'
import { getCurrentView } from '@ors/helpers/View/View'
import { StoreProvider } from '@ors/store'
import ThemeProvider from '@ors/themes/ThemeProvider'
import useSearchParams from '@ors/hooks/useSearchParams'

import '../themes/styles/global.css'
import { ProjectStatusType } from '@ors/types/api_project_statuses.ts'
import { ProjectSectorType } from '@ors/types/api_project_sector.ts'
import { ProjectSubSectorType } from '@ors/types/api_project_subsector.ts'
import { ProjectSubmissionStatusType } from '@ors/types/api_project_submission_statuses.ts'
import { ProjectSubstancesGroupsType } from '@ors/types/api_project_substances_groups'
import { MeetingType } from '@ors/types/api_meetings.ts'

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
  const [state, setState] = useState<any>({})

  useEffect(
    function () {
      const fetchStateData = async () => {
        setSlice('common.countries', { loaded: false, loading: true })
        setSlice('common.countries_for_create', {
          loaded: false,
          loading: true,
        })
        setSlice('common.countries_for_listing', {
          loaded: false,
          loading: true,
        })

        const countries =
          (await api<Country[]>('api/countries', {}, false)) ?? []

        setSlice('common.countries', {
          data: countries,
          error: null,
          loaded: true,
          loading: false,
        })
        setSlice('common.countries_for_create', {
          data: countries.filter((c) => c.has_cp_report && !c.is_a2),
          error: null,
          loaded: true,
          loading: false,
        })
        setSlice('common.countries_for_listing', {
          data: countries.filter((c) => c.has_cp_report),
          error: null,
          loaded: true,
          loading: false,
        })

        const dataFetchMapping = [
          { apiSettings: { path: 'api/agencies/' }, slice: 'common.agencies' },
          { apiSettings: { path: 'api/settings/' }, slice: 'common.settings' },

          {
            apiSettings: { path: 'api/user/permissions/' },
            slice: 'projects.user_permissions',
          },
          {
            apiSettings: { path: 'api/project-statuses/' },
            slice: 'projects.statuses',
          },
          {
            apiSettings: { path: 'api/project-submission-statuses/' },
            slice: 'projects.submission_statuses',
          },
          {
            apiSettings: { path: 'api/project-sector/' },
            slice: 'projects.sectors',
          },
          {
            apiSettings: { path: 'api/project-subsector/' },
            slice: 'projects.subsectors',
          },
          {
            apiSettings: { path: 'api/project-types/' },
            slice: 'projects.types',
          },
          {
            apiSettings: { path: 'api/meetings/' },
            slice: 'projects.meetings',
          },
          {
            apiSettings: { path: 'api/project-clusters/' },
            slice: 'projects.clusters',
          },
          {
            apiSettings: { path: 'api/groups/' },
            slice: 'projects.substances_groups',
          },

          {
            apiSettings: { path: 'api/project-sector/' },
            slice: 'businessPlans.sectors',
          },
          {
            apiSettings: { path: 'api/project-subsector/' },
            slice: 'businessPlans.subsectors',
          },
          {
            apiSettings: { path: 'api/project-types/' },
            slice: 'businessPlans.types',
          },
          {
            apiSettings: { path: 'api/decisions/' },
            slice: 'businessPlans.decisions',
          },

          {
            apiSettings: {
              path: 'api/blends/',
              params: { with_alt_names: true, with_usages: true },
            },
            slice: 'cp_reports.blends',
          },
          {
            apiSettings: {
              path: 'api/substances/',
              params: { with_alt_names: true, with_usages: true },
            },
            slice: 'cp_reports.substances',
          },
        ]
        dataFetchMapping.forEach((item) => fetchSliceData(item))
      }

      if (user) {
        fetchStateData()
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
            {children}
          </LoginWrapper>
        </ThemeProvider>
      </StoreProvider>
    </div>
  )
}

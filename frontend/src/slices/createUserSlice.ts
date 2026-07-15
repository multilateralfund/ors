import msalInstance from '@ors/config/msalConfig'
import { ApiUser } from '@ors/types/api_auth_user'
import type { CreateSliceProps } from '@ors/types/store'
import type { UserSlice } from '@ors/types/store'

import Cookies from 'js-cookie'

import api from '@ors/helpers/Api/_api'
import { getInitialSliceData, setSlice } from '@ors/helpers/Store/Store'

function removeCookies() {
  Cookies.remove('csrftoken')
  Cookies.remove('orsauth')
  Cookies.remove('orsrefresh')
}

export const createUserSlice = ({
  initialState,
}: CreateSliceProps): UserSlice => ({
  ...getInitialSliceData<ApiUser, Record<string, any> | null | undefined>(),
  // Get user
  getUser: async () => {
    setSlice('user', { loaded: false, loading: true })
    try {
      const apiUser = await api<ApiUser>('api/auth/user/', {})

      setSlice('user', {
        data: apiUser,
        error: null,
        loaded: true,
        loading: false,
      })

      return apiUser || null
    } catch (error) {
      setSlice('user', {
        data: null,
        error,
        loaded: true,
        loading: false,
      })

      return null
    }
  },
  // Login
  login: async (username, password) => {
    setSlice('user', { loaded: false, loading: true })
    try {
      const login = await api('api/auth/login/', {
        data: { password, username },
        method: 'post',
      })
      setSlice('user', {
        data: login.user,
        error: null,
        loaded: true,
        loading: false,
      })
    } catch (error) {
      setSlice('user', {
        data: null,
        error: await error.json?.(),
        loaded: true,
        loading: false,
      })
    }
  },
  // Logout
  logout: async () => {
    setSlice('user', { loaded: false, loading: true })
    try {
      await api('api/auth/logout/', {
        method: 'post',
      })

      const hasMsalSession = msalInstance.getAllAccounts().length > 0

      if (hasMsalSession) {
        await msalInstance.logoutRedirect({
          postLogoutRedirectUri: window.location.origin,
        })
      }

      removeCookies()

      setSlice('user', {
        data: null,
        error: null,
        loaded: true,
        loading: false,
      })
    } catch (error) {
      removeCookies()
      setSlice('user', {
        data: null,
        error,
        loaded: true,
        loading: false,
      })
    }
  },
  ...((initialState?.user || {}) as any),
})

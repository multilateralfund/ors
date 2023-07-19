import { Cookies } from 'react-cookie'
import { StoreApi } from 'zustand'

import api from '@ors/helpers/Api/Api'

export interface UserSlice {
  user: {
    data: null
    getUser?: () => void
    setUser?: (data: any) => void
    login?: (username: string, password: string) => void
    logout?: () => void
  }
}

export const createUserSlice = (
  set: StoreApi<UserSlice>['setState'],
  get: StoreApi<UserSlice>['getState'],
  initialState?: any,
): UserSlice => ({
  user: {
    data: null,
    // Get user
    getUser: async () => {
      try {
        const user = await api('api/auth/user/')
        get().user?.setUser?.(user)
      } catch (error) {
        get().user?.setUser?.(null)
      }
    },
    // Set user
    setUser: (data) => {
      set((state) => ({ ...state, user: { ...state.user, data } }))
    },
    // Login
    login: async (username, password) => {
      try {
        const login = await api('api/auth/login/', {
          method: 'post',
          data: { username, password },
        })
        get().user?.setUser?.(login.user)
      } catch (error) {
        get().user?.setUser?.(null)
        throw error
      }
    },
    logout: async () => {
      try {
        await api('api/auth/logout/', {
          method: 'post',
          credentials: 'omit',
        })
        const cookie = new Cookies()
        cookie.remove('sessionid')
        cookie.remove('orsrefresh')
        cookie.remove('orsauth')
        cookie.remove('csrftoken')
        get().user?.setUser?.(null)
      } catch (error) {
        get().user?.setUser?.(null)
        throw error
      }
    },
    ...(initialState?.user || {}),
  },
})

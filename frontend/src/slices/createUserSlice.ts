import Cookies from 'js-cookie'
import { StoreApi } from 'zustand'

import { DataType } from '@ors/@types/primitives'
import { api } from '@ors/helpers'
import { InitialStoreState, StoreState } from '@ors/store'

function removeCookies() {
  Cookies.remove('csrftoken')
  Cookies.remove('orsauth')
  Cookies.remove('orsrefresh')
}

export interface UserSlice {
  data: DataType
  getUser?: () => void
  login?: (username: string, password: string) => void
  logout?: () => void
  setUser?: (data: DataType) => void
}

export const createUserSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): UserSlice => ({
  data: null,
  // Get user
  getUser: async () => {
    try {
      const user = await api('api/auth/user/')
      get().user.setUser?.(user)
    } catch (error) {
      get().user.setUser?.(null)
    }
  },
  // Login
  login: async (username, password) => {
    try {
      const login = await api('api/auth/login/', {
        data: { password, username },
        method: 'post',
      })
      get().user.setUser?.(login.user)
    } catch (error) {
      get().user.setUser?.(null)
      throw error
    }
  },
  // Logout
  logout: async () => {
    try {
      await api('api/auth/logout/', {
        method: 'post',
      })
      removeCookies()
      get().user.setUser?.(null)
    } catch (error) {
      removeCookies()
      get().user.setUser?.(null)
      throw error
    }
  },
  // Set user
  setUser: (data) => {
    set((state) => ({ user: { ...state.user, data } }))
  },
  ...(initialState?.user || {}),
})

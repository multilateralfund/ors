import Cookies from 'js-cookie'
import { StoreApi } from 'zustand'

import config from '@ors/registry'
import { InitialStoreState, StoreState } from '@ors/store'

export interface ThemeSlice {
  mode: 'dark' | 'light' | null
  setMode?: (mode: 'dark' | 'light' | null) => void
}

export const createThemeSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): ThemeSlice => ({
  mode: initialState?.theme?.mode || null,
  setMode: (mode) => {
    set((state) => {
      Cookies.set(config.cookies.theme, mode as string)
      return { theme: { ...state.theme, mode } }
    })
  },
})

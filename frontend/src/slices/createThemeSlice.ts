import type {
  InitialStoreState,
  StoreState,
  ThemeSlice,
} from '@ors/types/store'

import Cookies from 'js-cookie'
import { StoreApi } from 'zustand'

import config from '@ors/registry'

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

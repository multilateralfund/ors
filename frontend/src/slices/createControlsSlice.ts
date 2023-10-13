/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  ControlsSlice,
  InitialStoreState,
  StoreState,
} from '@ors/types/store'

import { StoreApi } from 'zustand'

export const createControlsSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): ControlsSlice => ({
  setSidebar: (value) => {
    set((state) => {
      const sidebar = value ?? !state.controls.sidebar
      return { controls: { ...state.controls, sidebar } }
    })
  },
  sidebar: false,
})

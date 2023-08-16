/* eslint-disable @typescript-eslint/no-unused-vars */
import { StoreApi } from 'zustand'

import { InitialStoreState, StoreState } from '@ors/store'

export interface ControlsSlice {
  setSidebar?: (value?: boolean) => void
  sidebar: boolean
}

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

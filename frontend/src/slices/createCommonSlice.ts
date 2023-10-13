import type {
  CommonSlice,
  InitialStoreState,
  StoreState,
} from '@ors/types/store'

import { StoreApi } from 'zustand'

import { defaultSliceData } from '@ors/helpers/Store/Store'

export const createCommonSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): CommonSlice => {
  return {
    agencies: {
      ...defaultSliceData,
      ...(initialState?.common?.agencies || {}),
    },
    countries: {
      ...defaultSliceData,
      ...(initialState?.common?.countries || {}),
    },
    settings: {
      ...defaultSliceData,
      ...(initialState?.common?.settings || {}),
    },
  }
}

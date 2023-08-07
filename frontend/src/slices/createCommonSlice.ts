import { StoreApi } from 'zustand/esm'

import { defaultSliceData } from '@ors/helpers/Store/Store'
import { InitialStoreState, StoreState } from '@ors/store'
import { SliceData } from '@ors/types/primitives'

export interface CommonSlice {
  agencies: SliceData
  countries: SliceData
  settings: SliceData
}

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

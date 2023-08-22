import { StoreApi } from 'zustand'

import { defaultSliceData } from '@ors/helpers/Store/Store'
import { InitialStoreState, StoreState } from '@ors/store'
import { SliceData } from '@ors/types/primitives'

export interface ReportsSlice {
  blends: SliceData
  get: SliceData
  substances: SliceData
  usages: SliceData
}

export const createReportsSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): ReportsSlice => ({
  blends: {
    ...defaultSliceData,
    ...(initialState?.reports?.blends || {}),
  },
  get: {
    ...defaultSliceData,
  },
  substances: {
    ...defaultSliceData,
    ...(initialState?.reports?.substances || {}),
  },
  usages: {
    ...defaultSliceData,
    ...(initialState?.reports?.usages || {}),
  },
})

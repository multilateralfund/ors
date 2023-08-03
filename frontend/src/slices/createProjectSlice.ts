import { StoreApi } from 'zustand/esm'

import { defaultSliceData } from '@ors/helpers/Store/Store'
import { InitialStoreState, StoreState } from '@ors/store'
import { SliceData } from '@ors/types/primitives'

export interface ProjectsSlice {
  statuses: SliceData
}

export const createProjectSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): ProjectsSlice => {
  return {
    statuses: {
      ...defaultSliceData,
      ...(initialState?.projects?.statuses || {}),
    },
  }
}

import { StoreApi } from 'zustand/esm'

import { defaultSliceData } from '@ors/helpers/Store/Store'
import { InitialStoreState, StoreState } from '@ors/store'
import { SliceData } from '@ors/types/primitives'

export interface ProjectsSlice {
  meetings: SliceData
  sectors: SliceData
  statuses: SliceData
  subsectors: SliceData
  types: SliceData
}

export const createProjectSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): ProjectsSlice => {
  return {
    meetings: {
      ...defaultSliceData,
      ...(initialState?.projects?.meetings || {}),
    },
    sectors: {
      ...defaultSliceData,
      ...(initialState?.projects?.sectors || {}),
    },
    statuses: {
      ...defaultSliceData,
      ...(initialState?.projects?.statuses || {}),
    },
    subsectors: {
      ...defaultSliceData,
      ...(initialState?.projects?.subsectors || {}),
    },
    types: {
      ...defaultSliceData,
      ...(initialState?.projects?.types || {}),
    },
  }
}

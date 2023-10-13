import type {
  InitialStoreState,
  ProjectsSlice,
  StoreState,
} from '@ors/types/store'

import { StoreApi } from 'zustand'

import { defaultSliceData } from '@ors/helpers/Store/Store'

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

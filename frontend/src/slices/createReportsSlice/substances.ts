import { StoreApi } from 'zustand'

import { Params, SliceData } from '@ors/@types/primitives'
import api from '@ors/helpers/Api/Api'
import {
  defaultSliceData,
  getErrorSliceData,
  getPendingSliceData,
  getSuccessSliceData,
} from '@ors/helpers/Store/Store'
import { InitialStoreState, StoreState } from '@ors/store'

export interface SubstancesSlice {
  get: SliceData
  getSubstances?: (params?: Params) => void
}

export interface InitialSubstancesSlice {
  get?: Partial<SliceData>
}

export const createSubstancesSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): SubstancesSlice => ({
  get: {
    ...defaultSliceData,
    ...(initialState?.reports?.substances?.get || {}),
  },
  getSubstances: async (params) => {
    const prevSubstances = get().reports.substances || {}
    const getSliceData = {
      ...(prevSubstances.get || defaultSliceData),
    }
    try {
      set((state) => ({
        reports: {
          ...state.reports,
          substances: {
            ...prevSubstances,
            get: { ...getSliceData, ...getPendingSliceData() },
          },
        },
      }))
      const substances = await api(
        `api/substances/${
          params ? `?${new URLSearchParams(params).toString()}` : ''
        }`,
      )
      set((state) => ({
        reports: {
          ...state.reports,
          substances: {
            ...prevSubstances,
            get: { ...getSliceData, ...getSuccessSliceData(substances) },
          },
        },
      }))
    } catch (error) {
      set((state) => ({
        reports: {
          ...state.reports,
          substances: {
            ...prevSubstances,
            get: { ...getSliceData, ...getErrorSliceData(error) },
          },
        },
      }))
    }
  },
})

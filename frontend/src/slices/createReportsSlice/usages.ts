import { StoreApi } from 'zustand'

import api from '@ors/helpers/Api/Api'
import {
  defaultSliceData,
  getErrorSliceData,
  getPendingSliceData,
  getSuccessSliceData,
} from '@ors/helpers/Store/Store'
import { InitialStoreState, StoreState } from '@ors/store'
import { Params, SliceData } from '@ors/types/primitives'

export interface UsagesSlice {
  get: SliceData
  getUsages?: (params?: Params) => void
}

export interface InitialUsagesSlice {
  get?: Partial<SliceData>
}

export const createUsagesSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): UsagesSlice => ({
  get: {
    ...defaultSliceData,
    ...(initialState?.reports?.usages?.get || {}),
  },
  getUsages: async (params) => {
    const prevUsages = get().reports.usages || {}
    const getSliceData = {
      ...(prevUsages.get || defaultSliceData),
    }
    try {
      set((state) => ({
        reports: {
          ...state.reports,
          usages: {
            ...prevUsages,
            get: { ...getSliceData, ...getPendingSliceData() },
          },
        },
      }))
      const usages = await api(
        `api/usages/${
          params ? `?${new URLSearchParams(params).toString()}` : ''
        }`,
      )
      set((state) => ({
        reports: {
          ...state.reports,
          usages: {
            ...prevUsages,
            get: { ...getSliceData, ...getSuccessSliceData(usages) },
          },
        },
      }))
    } catch (error) {
      set((state) => ({
        reports: {
          ...state.reports,
          usages: {
            ...prevUsages,
            get: { ...getSliceData, ...getErrorSliceData(error) },
          },
        },
      }))
    }
  },
})

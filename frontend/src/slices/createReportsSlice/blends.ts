import { StoreApi } from 'zustand'

import { Params, SliceData } from '@ors/types/primitives'
import { api } from '@ors/helpers'
import {
  defaultSliceData,
  getErrorSliceData,
  getPendingSliceData,
  getSuccessSliceData,
} from '@ors/helpers/Store/Store'
import { InitialStoreState, StoreState } from '@ors/store'

export interface BlendsSlice {
  get: SliceData
  getBlends?: (params?: Params) => void
}

export interface InitialBlendsSlice {
  get?: Partial<SliceData>
}

export const createBlendsSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): BlendsSlice => ({
  get: {
    ...defaultSliceData,
    ...(initialState?.reports?.blends?.get || {}),
  },
  getBlends: async (params) => {
    const prevBlends = get().reports.blends || {}
    const getSliceData = {
      ...(prevBlends.get || defaultSliceData),
    }
    try {
      set((state) => ({
        reports: {
          ...state.reports,
          blends: {
            ...prevBlends,
            get: { ...getSliceData, ...getPendingSliceData() },
          },
        },
      }))
      const blends = await api(
        `api/blends/${
          params ? `?${new URLSearchParams(params).toString()}` : ''
        }`,
      )
      set((state) => ({
        reports: {
          ...state.reports,
          blends: {
            ...prevBlends,
            get: { ...getSliceData, ...getSuccessSliceData(blends) },
          },
        },
      }))
    } catch (error) {
      set((state) => ({
        reports: {
          ...state.reports,
          blends: {
            ...prevBlends,
            get: { ...getSliceData, ...getErrorSliceData(error) },
          },
        },
      }))
    }
  },
})

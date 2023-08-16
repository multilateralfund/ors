/* eslint-disable @typescript-eslint/no-unused-vars */
import { StoreApi } from 'zustand'

// import config from '@ors/registry'
import { InitialStoreState, StoreState } from '@ors/store'

export interface CacheSlice {
  data: {
    [key: string]: any
  }
  getCache: (id: string) => any
  setCache: (id: string, data: any) => void
}

export const createCacheSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): CacheSlice => ({
  data: {},
  getCache: (id) => {
    get().cache.data[id]
  },
  setCache: (id, data) => {
    set((state) => ({
      cache: {
        ...state.cache,
        data: {
          ...state.cache.data,
          [id]: data,
        },
      },
    }))
  },
})

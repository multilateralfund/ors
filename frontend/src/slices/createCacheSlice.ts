/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  CacheSlice,
  InitialStoreState,
  StoreState,
} from '@ors/types/store'

import { StoreApi } from 'zustand'

export const createCacheSlice = (
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  initialState?: InitialStoreState,
): CacheSlice => ({
  data: {},
  getCache: (id) => {
    get().cache.data[id]
  },
  removeCache: (id) => {
    const data = { ...get().cache.data }
    delete data[id]
    set((state) => ({
      cache: {
        ...state.cache,
        data,
      },
    }))
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

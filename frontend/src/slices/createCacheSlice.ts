import type { CacheSlice } from '@ors/types/store'

import { produce } from 'immer'

import { CreateSliceProps } from '@ors/store'

export const createCacheSlice = ({
  get,
  set,
}: CreateSliceProps): CacheSlice => ({
  data: {},
  getCache: (id) => {
    get().cache.data[id]
  },
  removeCache: (id) => {
    const data = { ...get().cache.data }
    delete data[id]
    set(
      produce((state) => {
        state.cache.data = data
      }),
    )
  },
  setCache: (id, data) => {
    set(
      produce((state) => {
        state.cache.data[id] = data
      }),
    )
  },
})

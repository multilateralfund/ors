import type { CreateSliceProps } from '@ors/types/store'
import type { CacheSlice } from '@ors/types/store'

import { produce } from 'immer'

export const createCacheSlice = ({
  get,
  set,
}: CreateSliceProps): CacheSlice => ({
  data: {},
  getCache: (id) => {
    console.debug('CACHE getCache: %s', id)
    return get().cache.data[id]
  },
  removeCache: (id) => {
    const data = { ...get().cache.data }
    delete data[id]
    set(
      produce((state) => {
        state.cache.data = data
      }),
    )
    console.debug('CACHE removeCache: %s', id)
  },
  setCache: (id, data) => {
    set(
      produce((state) => {
        state.cache.data[id] = data
      }),
    )
    console.debug('CACHE setCache: %s', id)
  },
})

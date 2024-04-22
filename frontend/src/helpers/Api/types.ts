export interface IApi {
  options: {
    data?: any
    delay?: number | undefined
    headers?: any
    invalidateCache?: boolean
    method?: string
    next?: any
    params?: Record<string, any>
    removeCacheTimeout?: number
    triggerIf?: boolean
    updateSliceData?: string
    withStoreCache?: boolean
  }
  path: string
  throwError?: boolean
}

export type ResultsType<D> = {
  count: number
  loaded: boolean
  results: D[]
}

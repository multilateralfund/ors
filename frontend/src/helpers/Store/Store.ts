import type { StoreState } from '@ors/store'
import type { DataType, ErrorType } from '@ors/types/primitives'
import type { StoreApi } from 'zustand'

import { api } from '@ors/helpers'

type AllowedMethods = 'delete' | 'get' | 'patch' | 'post'

export function getBranchWithProperties(
  tree: { [key: string]: any },
  parentPath: Array<string>,
  additionalProperties: {
    data?: DataType
    error?: ErrorType
    loaded?: boolean
    loading?: boolean
  },
  depth = 0,
) {
  if (parentPath.length === 0) {
    // If parentPath is empty, return the modified tree with additional properties
    return { ...tree, ...additionalProperties }
  }

  const [currentKey, ...remainingPath] = parentPath

  if (!tree[currentKey]) {
    // If the key in parentPath is not found in the tree, throw an error
    throw new Error(
      `Invalid parentPath: '${currentKey}' not found in the tree.`,
    )
  }

  // Recursively traverse the tree to find the specified branch
  tree[currentKey] = getBranchWithProperties(
    tree[currentKey],
    remainingPath,
    additionalProperties,
    depth + 1,
  )

  // Remove sibling properties
  if (depth === 0) {
    for (const key in tree) {
      if (key !== currentKey) {
        delete tree[key]
      }
    }
  }

  return tree
}

export const defaultSliceData = {
  data: null,
  error: null,
  loaded: false,
  loading: false,
}

export function getInitialSliceData(data: DataType): {
  data: DataType
  error: ErrorType
  loaded: boolean
  loading: boolean
} {
  return {
    data,
    error: null,
    loaded: !!data,
    loading: false,
  }
}

export function getPendingSliceData(): { loaded: boolean; loading: boolean } {
  return {
    loaded: false,
    loading: true,
  }
}

export function getSuccessSliceData(data: DataType): {
  data: DataType
  error: ErrorType
  loaded: boolean
  loading: boolean
} {
  return {
    data,
    error: null,
    loaded: true,
    loading: false,
  }
}

export function getErrorSliceData(error: ErrorType): {
  data: DataType
  error: ErrorType
  loaded: boolean
  loading: boolean
} {
  return {
    data: null,
    error,
    loaded: false,
    loading: false,
  }
}

// async function makeRequest(
//   set: StoreApi<StoreState>['setState'],
//   get: StoreApi<StoreState>['getState'],
//   parentPath: Array<string>,
//   endpoint: string,
//   options?: {
//     data?: any
//     delay?: number | undefined
//     headers?: any
//     method?: string
//     next?: any
//   },
// ) {
//   const method = (options?.method || 'get').toLowerCase()
//   set((state) =>
//     getBranchWithProperties(
//       state,
//       [...parentPath, method],
//       getPendingSliceData(),
//     ),
//   )
//   try {
//     const data = await api(endpoint, { ...options, method: method })
//     set((state) =>
//       getBranchWithProperties(
//         state,
//         [...parentPath, method],
//         getSuccessSliceData(data),
//       ),
//     )
//   } catch (error) {
//     set((state) =>
//       getBranchWithProperties(
//         state,
//         [...parentPath, method],
//         getErrorSliceData(error),
//       ),
//     )
//   }
// }

const methodsConfig: Record<
  AllowedMethods,
  {
    callback: (
      set: StoreApi<StoreState>['setState'],
      get: StoreApi<StoreState>['getState'],
      parentPath: Array<string>,
      endpoint: string,
      options?: {
        data?: any
        delay?: number | undefined
        headers?: any
        method?: string
        next?: any
      },
    ) => () => void
    callbackName: string
  }
> = {
  delete: {
    callback: () => {
      return () => {}
    },
    callbackName: 'remove',
  },
  get: {
    callback: (set, get, parentPath, endpoint, options) => {
      return async () => {
        set((state) =>
          getBranchWithProperties(
            state,
            [...parentPath, 'get'],
            getPendingSliceData(),
          ),
        )
        try {
          const data = await api(endpoint, { ...options, method: 'get' })
          set((state) =>
            getBranchWithProperties(
              state,
              [...parentPath, 'get'],
              getSuccessSliceData(data),
            ),
          )
        } catch (error) {
          set((state) =>
            getBranchWithProperties(
              state,
              [...parentPath, 'get'],
              getErrorSliceData(error),
            ),
          )
        }
      }
    },
    callbackName: 'fetch',
  },
  patch: {
    callback: () => {
      return () => {}
    },
    callbackName: 'update',
  },
  post: {
    callback: () => {
      return () => {}
    },
    callbackName: 'create',
  },
}

export function createApiSlice(
  set: StoreApi<StoreState>['setState'],
  get: StoreApi<StoreState>['getState'],
  methods: Array<{
    endpoint: string
    options?: {
      data?: any
      delay?: number | undefined
      headers?: any
      method?: string
      next?: any
    }
    type: AllowedMethods
  }>,
  parentPath: Array<string>,
) {
  const slice: any = {}
  methods.forEach((method) => {
    const methodConfig = methodsConfig[method.type]
    if (!methodConfig) return
    slice[method.type] = {
      ...defaultSliceData,
    }
    slice[methodConfig.callbackName] = methodConfig.callback(
      set,
      get,
      parentPath,
      method.endpoint,
      method.options,
    )
  })
}

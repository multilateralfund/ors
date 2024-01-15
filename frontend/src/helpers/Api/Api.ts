import { DataType } from '@ors/types/primitives'

import Cookies from 'js-cookie'
import { includes } from 'lodash'
import hash from 'object-hash'

import { addTrailingSlash, removeFirstSlash } from '@ors/helpers/Url/Url'
import { debounce, removeEmptyValues } from '@ors/helpers/Utils/Utils'
import config from '@ors/registry'
import { store } from '@ors/store'

export type Api = {
  options: {
    data?: any
    delay?: number | undefined
    headers?: any
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

const REMOVE_CACHE_TIMEOUT = 300 // seconds

const defaultHeaders: { [key: string]: { [key: string]: any } } = {
  common: {
    Accept: 'application/json',
  },
  del: {},
  patch: {
    'Content-Type': 'application/json',
  },
  post: {
    'Content-Type': 'application/json',
  },
  put: {
    'Content-Type': 'application/json',
  },
  get: {},
}

function delayExecution(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function formatApiUrl(path: string) {
  // Check if the path is external
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  let adjustedPath,
    apiPath = ''
  const settings = __CLIENT__ ? store.current.getState().settings : null
  const headers = __SERVER__ ? require('next/headers').headers() : null
  const protocol = (
    __CLIENT__ ? settings?.protocol : headers?.get('x-next-protocol')
  ).split(',')[0]
  const host = __CLIENT__ ? settings?.host : headers?.get('x-next-host')

  if (config.settings.apiPath) {
    apiPath = config.settings.apiPath
  } else {
    apiPath = protocol + '://' + host
  }

  apiPath = addTrailingSlash(apiPath)
  adjustedPath = removeFirstSlash(path)
  adjustedPath =
    adjustedPath !== '/' ? addTrailingSlash(adjustedPath) : adjustedPath

  return `${apiPath}${adjustedPath}`
}

async function api(
  path: Api['path'],
  options?: Api['options'],
  throwError: Api['throwError'] = true,
) {
  const [state, setState] = __CLIENT__
    ? [store.current.getState(), store.current.setState]
    : [null, null]
  const nextCookies = __SERVER__ && require('next/headers').cookies()
  const {
    data = null,
    delay,
    headers = {},
    method = 'get',
    next = {},
    params = undefined,
    removeCacheTimeout = REMOVE_CACHE_TIMEOUT,
    triggerIf = true,
    withStoreCache = false,
    ...opts
  } = options || {}
  let fullPath = formatApiUrl(path)
  const id = withStoreCache ? hash({ options, path }) : ''
  const csrftoken = __CLIENT__ && Cookies.get('csrftoken')
  const sendRequestTime = delay ? new Date().getTime() : 0

  if (
    state &&
    state.internalError &&
    includes(['TypeError', 'ECONNREFUSED'], state.internalError.status)
  ) {
    return null
  }

  if (params) {
    const querystring = new URLSearchParams(
      removeEmptyValues(params),
    ).toString()
    fullPath += querystring ? '?' + querystring : ''
  }

  if (state && withStoreCache && state.cache.data[id]) {
    return state.cache.data[id]
  }

  if (!triggerIf) {
    return
  }

  async function handleError(error: any) {
    if (
      error &&
      setState &&
      includes(
        [undefined, 'TypeError', 'ECONNREFUSED'],
        error.status || error.name,
      )
    ) {
      setState({
        internalError: {
          _info: error,
          status: 'ECONNREFUSED',
        },
      })
    }
    if (throwError) {
      throw error
    } else {
      return null
    }
  }

  async function handleResponse(response: any) {
    try {
      const data = await response.json()
      if (state && withStoreCache) {
        debounce(
          () => {
            state.cache.removeCache(id)
          },
          removeCacheTimeout * 1000,
          `Api:removeCache:${id}`,
        )
        state.cache.setCache(id, data)
      }
      return data
    } catch {
      if (throwError) {
        return response
      }
      return null
    }
  }

  async function fetcher() {
    return await fetch(fullPath, {
      credentials: 'include',
      headers: {
        ...(__SERVER__ ? { Cookie: nextCookies.toString() } : {}),
        ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
        ...defaultHeaders['common'],
        ...defaultHeaders[method.toLowerCase()],
        ...headers,
      },
      method: method.toUpperCase(),
      ...(data ? { body: JSON.stringify(data) } : {}),
      ...next,
      ...opts,
    })
  }

  try {
    const response = await fetcher()
    const receiveResponseTime = delay ? new Date().getTime() : 0
    const responseTimeMs = receiveResponseTime - sendRequestTime
    // Delay response time
    if (delay && delay - responseTimeMs > 0) {
      await delayExecution(delay - responseTimeMs)
    }
    if (response.ok) {
      return await handleResponse(response)
    } else {
      return await handleError(response)
    }
  } catch (error) {
    return await handleError(error)
  }
}

export function getResults(data: DataType): {
  count: number
  loaded: boolean
  results: Array<any>
} {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      loaded: true,
      results: data,
    }
  }
  if (data && typeof data === 'object' && Array.isArray(data.results)) {
    return {
      ...(data || {}),
      count: typeof data.count === 'number' ? data.count : 0,
      loaded: true,
      results: data.results || [],
    }
  }
  return {
    count: 0,
    loaded: false,
    results: [],
  }
}

export async function fetcher({
  onError = () => {},
  onPending = () => {},
  onSuccess = () => {},
  options,
  path,
  throwError,
}: {
  onError?: (error: any) => void
  onPending?: () => void
  onSuccess?: (data: any) => void
  options?: Api['options']
  path: Api['path']
  throwError?: Api['throwError']
}) {
  if (!throwError) {
    const data = await api(path, options, throwError)
    onSuccess(data || null)
    return data
  }
  onPending()
  try {
    const data = await api(path, options, throwError)
    onSuccess(data)
    return data
  } catch (error) {
    onError(error)
    return error
  }
}

export default api

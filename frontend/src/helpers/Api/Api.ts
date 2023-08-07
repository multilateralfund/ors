import type { DataType } from '@ors/types/primitives'

import Cookies from 'js-cookie'
import { redirect } from 'next/navigation'
import hash from 'object-hash'

import {
  addTrailingSlash,
  removeFirstSlash,
  removeTrailingSlash,
} from '@ors/helpers/Url/Url'
import config from '@ors/registry'
import { getStore } from '@ors/store'

export type Api = {
  options?: {
    data?: any
    delay?: number | undefined
    headers?: any
    method?: string
    next?: any
    params?: Record<string, any>
    updateSliceData?: string
    withStoreCache?: boolean
  }
  path: string
  throwError?: boolean
}

const nextCookies = require('next/headers').cookies

const defaultHeaders: { [key: string]: { [key: string]: any } } = {
  common: {
    Accept: 'application/json',
  },
  del: {},
  get: {},
  patch: {},
  post: {
    'Content-Type': 'application/json',
  },
  put: {},
}

function delayExecution(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function formatApiUrl(path: string) {
  // Check if the path is external
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const { settings } = config
  let apiPath = ''
  let adjustedPath

  if (__DEVELOPMENT__) {
    apiPath = settings.apiPath || 'http://127.0.0.1:8000'
  } else if (__SERVER__) {
    const headers = require('next/headers').headers()
    apiPath =
      headers.get('x-next-protocol').split(',')[0] +
      '://' +
      headers.get('x-next-host')
  } else if (__CLIENT__) {
    apiPath = window.location.origin
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
  const nextHeaders = __SERVER__ ? require('next/headers').headers() : null
  const store = __CLIENT__ ? getStore() : null
  const storeState = store ? store.getState() : null
  const {
    data = null,
    delay,
    headers = {},
    method = 'get',
    next = {},
    params = undefined,
    // updateSliceData = undefined,
    withStoreCache = false,
    ...opts
  } = options || {}
  const id = withStoreCache ? hash({ options, path }) : ''
  const pathname = __SERVER__
    ? nextHeaders.get('x-next-pathname')
    : removeTrailingSlash(window.location.pathname)
  const csrftoken = !__SERVER__ ? Cookies.get('csrftoken') : null
  const sendRequestTime = delay ? new Date().getTime() : 0
  // const sliceData = updateSliceData ? {} : null
  let fullPath = formatApiUrl(path)
  if (params) {
    fullPath +=
      '?' +
      new URLSearchParams(
        Object.entries(params).filter(
          ([, value]) => value !== null && value !== undefined && value !== '',
        ),
      ).toString()
  }

  if (withStoreCache && storeState?.cache.data[id]) {
    return storeState.cache.data[id]
  }

  function handleEconnrefused(error: any) {
    console.log('ECONNREFUSED for endpoint:', fullPath)
    console.log(error)
    if (pathname !== '/econnrefused') {
      redirect('/econnrefused')
    }
  }

  function handleError(error: any) {
    switch (error.status || error.name) {
      case undefined:
        handleEconnrefused(error)
        break
      case 'TypeError':
        handleEconnrefused(error)
        break
      case 'ECONNREFUSED':
        handleEconnrefused(error)
        break
      case 403:
        if (store) {
          store.setState((state) => ({
            ...state,
            user: { ...state.user, data: null },
          }))
        }
        break
      default:
        if (throwError) {
          throw error
        } else {
          return null
        }
    }
  }

  async function fetcher() {
    return await fetch(fullPath, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(__SERVER__ ? { Cookie: nextCookies().toString() } : {}),
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
    const cachedFetcher = fetcher
    const response = await cachedFetcher()
    const receiveResponseTime = delay ? new Date().getTime() : 0
    const responseTimeMs = receiveResponseTime - sendRequestTime
    // Delay response time
    if (delay && delay - responseTimeMs > 0) {
      await delayExecution(delay - responseTimeMs)
    }
    if (response.ok) {
      try {
        const data = await response.json()
        if (withStoreCache) {
          storeState?.cache.setCache(id, data)
        }
        return data
      } catch {
        if (throwError) {
          return response
        }
        return null
      }
    } else {
      handleError(response)
    }
  } catch (error) {
    console.log('HERE ERROR', error)
    return handleError(error)
  }
}

export function getResults(data: DataType): {
  count: number
  results: Array<any>
} {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      results: data,
    }
  }
  if (data && typeof data === 'object' && Array.isArray(data.results)) {
    return {
      ...(data || {}),
      count: typeof data.count === 'number' ? data.count : 0,
      results: data.results || [],
    }
  }
  return {
    count: 0,
    results: [],
  }
}

export async function fetcher({
  onError = () => {},
  onPending = () => {},
  onSuccess = () => {},
  onSuccessNoCatch = () => {},
  options,
  path,
  throwError,
}: {
  onError?: (...args: any) => void
  onPending?: (...args: any) => void
  onSuccess?: (...args: any) => void
  onSuccessNoCatch?: (...args: any) => void
  options?: Api['options']
  path: Api['path']
  throwError?: Api['throwError']
}) {
  if (!throwError) {
    const data = await api(path, options, throwError)
    onSuccessNoCatch(data)
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

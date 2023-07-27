import type { DataType } from '@ors/types/primitives'

import Cookies from 'js-cookie'
import { redirect } from 'next/navigation'

import {
  addTrailingSlash,
  removeFirstSlash,
  removeTrailingSlash,
} from '@ors/helpers/Url/Url'
import config from '@ors/registry'
import { getStore } from '@ors/store'

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
  // Check if path is external
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const { settings } = config
  let apiPath, adjustedPath

  if (__DEVELOPMENT__) {
    apiPath = settings.apiPath || 'http://127.0.0.1:8000'
  } else if (__SERVER__) {
    const headers = require('next/headers').headers()
    apiPath = headers.get('x-next-host')
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
  path: string,
  options?: {
    data?: any
    delay?: number | undefined
    headers?: any
    method?: string
    next?: any
  },
  throwError = true,
) {
  const nextHeaders = __SERVER__ ? require('next/headers').headers() : null
  const store = __CLIENT__ ? getStore() : null
  const {
    data = null,
    delay,
    headers = {},
    method = 'get',
    next = {},
    ...opts
  } = options || {}
  const pathname = __SERVER__
    ? nextHeaders.get('x-next-pathname')
    : removeTrailingSlash(window.location.pathname)
  const csrftoken = !__SERVER__ ? Cookies.get('csrftoken') : null
  const sendRequest = delay ? new Date().getTime() : 0
  try {
    const response = await fetch(formatApiUrl(path), {
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
    const receiveResponse = delay ? new Date().getTime() : 0
    const responseTimeMs = receiveResponse - sendRequest
    // Delay response time
    if (delay && delay - responseTimeMs > 0) {
      await delayExecution(delay - responseTimeMs)
    }
    switch (response.status) {
      case 403:
        if (store) {
          store.setState((state) => ({
            ...state,
            user: { ...state.user, data: null },
          }))
        }
        break
      default:
        if (response.ok) {
          try {
            return await response.json()
          } catch {
            if (throwError) {
              return response
            }
            return null
          }
        } else if (throwError) {
          throw response
        } else {
          return null
        }
    }
  } catch (e) {
    console.log(e)
    // Handle ECONNREFUSED
    if (pathname !== '/econnrefused') {
      redirect('/econnrefused')
    }
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

export default api

import Cookies from 'js-cookie'

import { AnyObject } from '@ors/@types/primitives'
import config from '@ors/registry'

const nextCookies = require('next/headers').cookies
const nextHeaders = require('next/headers').headers
const redirect = require('next/navigation').redirect

const __SERVER__ = typeof window === 'undefined'

const defaultHeaders: { [key: string]: { [key: string]: any } } = {
  get: {},
  post: {
    'Content-Type': 'application/json',
  },
  put: {},
  patch: {},
  del: {},
  common: {
    Accept: 'application/json',
  },
}

function delayExecution(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function formatUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const { settings } = config
  const adjustedPath = path[0] !== '/' ? `/${path}` : path

  return `${settings.apiPath}${adjustedPath}`
}

async function api(
  path: string,
  options?: {
    method?: string
    data?: AnyObject
    headers?: AnyObject
    next?: AnyObject
    delay?: number | undefined
    [key: string]: any
  },
  throwError = true,
) {
  const {
    method = 'get',
    data = null,
    headers = {},
    next = {},
    delay,
    ...opts
  } = options || {}
  const csrftoken = !__SERVER__ ? Cookies.get('csrftoken') : null
  const pathname = __SERVER__
    ? nextHeaders().get('x-next-pathname')
    : window.location.pathname
  const sendRequest = new Date().getTime()
  const response = await fetch(formatUrl(path), {
    method: method.toUpperCase(),
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(__SERVER__ ? { Cookie: nextCookies().toString() } : {}),
      ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}),
      ...defaultHeaders['common'],
      ...defaultHeaders[method.toLowerCase()],
      ...headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
    ...next,
    ...opts,
  })
  const receiveResponse = new Date().getTime()
  const responseTimeMs = receiveResponse - sendRequest
  // Delay response time
  if (delay && delay - responseTimeMs > 0) {
    await delayExecution(delay - responseTimeMs)
  }
  switch (response.status) {
    case 403:
      // if (pathname !== '/login' && __SERVER__) {
      //   redirect('/login')
      // } else if (pathname !== '/login') {
      //   window.location.href = '/login'
      // }
      break
    default:
      if (response.ok) {
        try {
          return await response.json()
        } catch {
          return response
        }
      } else if (throwError) {
        throw response
      } else {
        return null
      }
  }
}

export default api

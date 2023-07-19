import Cookies from 'js-cookie'

import config from '@ors/registry'

const nextCookies = require('next/headers').cookies
const nextHeaders = require('next/headers').headers
const redirect = require('next/navigation').redirect

const __SERVER__ = typeof window === 'undefined'

type Object = null | { [key: string]: any }

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
    data?: Object
    headers?: Object
    next?: Object
    [key: string]: any
  },
  throwError = true,
) {
  const {
    method = 'get',
    data = null,
    headers = {},
    next = {},
    ...opts
  } = options || {}
  const pathname = __SERVER__
    ? nextHeaders().get('x-next-pathname')
    : window.location.pathname
  const response = await fetch(formatUrl(path), {
    method: method.toUpperCase(),
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(!__SERVER__ ? { 'X-CSRFToken': Cookies.get('csrftoken') } : {}),
      ...(__SERVER__ ? { Cookie: nextCookies().toString() } : {}),
      ...defaultHeaders['common'],
      ...defaultHeaders[method.toLowerCase()],
      ...headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
    ...next,
    ...opts,
  })
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

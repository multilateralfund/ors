import Cookies from 'js-cookie'
import { includes, omit } from 'lodash'
import hash from 'object-hash'

import { store } from '@ors/_store'
import { debounce, removeEmptyValues } from '@ors/helpers/Utils/Utils'

import { REMOVE_CACHE_TIMEOUT, defaultHeaders } from './constants'
import { IApi } from './types'
import { delayExecution, formatApiUrl } from './utils'

export default async function api<T = any>(
  path: IApi['path'],
  options?: IApi['options'],
  throwError: IApi['throwError'] = true,
): Promise<T | null | undefined> {
  const [state, setState] = [store.current.getState(), store.current.setState]
  const {
    data = null,
    delay,
    headers = {},
    invalidateCache = false,
    method = 'get',
    next = {},
    params = undefined,
    removeCacheTimeout = REMOVE_CACHE_TIMEOUT,
    triggerIf = true,
    withStoreCache = false,
    ...opts
  } = options || {}
  let fullPath = formatApiUrl(path)
  const id = withStoreCache
    ? hash({ options: { ...omit(options, ['invalidateCache']) }, path })
    : ''
  const csrftoken = Cookies.get('csrftoken')
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
    if (invalidateCache) {
      state.cache.removeCache(id)
    } else {
      return state.cache.data[id]
    }
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
      console.debug(
        'API handleResponse: %s (cached: %s)',
        fullPath,
        withStoreCache ? id : 'no',
      )
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

import { redirect } from 'next/navigation'
import hash from 'object-hash'

import { removeTrailingSlash } from '@ors/helpers/Url/Url'
import { getStore } from '@ors/store'

import { debounce } from '../Utils/Utils'
import defaultApi, { Api } from './Api'

export { fetcher as defaultFetcher, formatApiUrl, getResults } from './Api'

const REMOVE_CACHE_TIMEOUT = 300000 // ms

async function api(
  path: Api['path'],
  options?: Api['options'],
  throwError: Api['throwError'] = true,
) {
  const nextHeaders = __SERVER__ ? require('next/headers').headers() : null
  const store = __CLIENT__ ? getStore() : null
  const storeState = store ? store.getState() : null
  const { withStoreCache = false } = options || {}
  const id = withStoreCache ? hash({ options, path }) : ''

  if (withStoreCache && storeState?.cache.data[id]) {
    debounce(
      () => {
        storeState.cache.removeCache(id)
      },
      REMOVE_CACHE_TIMEOUT,
      `remove_cache_${id}`,
    )
    return storeState.cache.data[id]
  }

  const pathname = __SERVER__
    ? nextHeaders.get('x-next-pathname')
    : removeTrailingSlash(window.location.pathname)

  function handleEconnrefused(error: any) {
    console.log('ECONNREFUSED for endpoint:', path)
    console.log(error)
    if (pathname !== '/econnrefused') {
      redirect('/econnrefused')
    }
  }

  async function handleError(error: any) {
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

  async function handleResponse(response: any) {
    try {
      const data = await response.json()
      if (withStoreCache && storeState) {
        debounce(
          () => {
            storeState.cache.removeCache(id)
          },
          REMOVE_CACHE_TIMEOUT,
          `remove_cache_${id}`,
        )
        storeState.cache.setCache(id, data)
      }
      return data
    } catch {
      if (throwError) {
        return response
      }
      return null
    }
  }

  return defaultApi(path, options, throwError, handleResponse, handleError)
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

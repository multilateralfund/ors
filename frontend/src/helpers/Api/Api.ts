import { headers } from 'next/headers'
import config from '@ors/registry'
import { getAuthToken } from '@ors/helpers/AuthToken/AuthToken'
import { removeTrailingSlash } from '@ors/helpers/Url/Url'

const __SERVER__ = typeof window === 'undefined'
const methods = ['get', 'post', 'put', 'patch', 'del']

type ApiMethod = (
  path: string,
  options?: {
    data?: any | undefined
    headers?: {} | undefined
    opts?: {} | undefined
  },
) => Promise<unknown>

function formatUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const headersList = headers()
  const { settings } = config
  const referer = headersList.get('referer') || ''
  const host = __SERVER__
    ? removeTrailingSlash(referer)
    : removeTrailingSlash(window.location.origin)
  const adjustedPath = path[0] !== '/' ? `/${path}` : path

  return `${host}/${settings.apiPathTraversal}${adjustedPath}`
}

export function getError(error: any) {
  try {
    return JSON.parse(error?.text)
  } catch {
    return error?.body || error
  }
}

/**
 * Api class.
 * @class Api
 */
class Api {
  // post: ApiMethod;
  // put: ApiMethod;
  // patch: ApiMethod;
  // del: ApiMethod;
  [key: string]: ApiMethod | Function

  /**
   * Constructor
   * @method constructor
   * @constructs Api
   */
  constructor() {
    methods.forEach((method) => {
      this[method] = (path, { data, headers = {}, ...opts } = {}) => {
        let promise = new Promise(async (resolve, reject) => {
          const authToken = await getAuthToken()
          const response = await fetch(formatUrl(path), {
            method: method.toUpperCase(),
            headers: {
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              ...headers,
              Accept: 'application/json',
            },
            ...(data ? { body: data } : {}),
            ...opts,
          })
          if (response.ok) {
            resolve(await response.json())
          } else {
            reject(getError(response))
          }
        })
        return promise
      }
    })
  }
}

export default Api

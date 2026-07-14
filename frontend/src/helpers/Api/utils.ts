import { store } from '@ors/_store'
import { addTrailingSlash, removeFirstSlash } from '@ors/helpers/Url/Url'
import config from '@ors/registry'
import { removeEmptyValues } from '@ors/helpers'
import msalInstance, { scopes } from '@ors/config/msalConfig'

export function delayExecution(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// Requests authenticated through Microsoft SSO have no Django session, so
// they need this Authorization header to be recognized by the backend.
export async function getMsalAuthHeaders(): Promise<Record<string, string>> {
  const account =
    msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0]

  if (!account) {
    return {}
  }

  const tokenResponse = await msalInstance.acquireTokenSilent({
    scopes,
    account,
  })

  return { Authorization: `Bearer ${tokenResponse.accessToken}` }
}

export function longDownloadUrl(targetUrl: string) {
  const params = new URLSearchParams({ target: targetUrl })
  return `/download?${params.toString()}`
}

export function formatApiUrl(path: string, params?: Record<string, any>) {
  // Check if the path is external
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  let adjustedPath,
    apiPath = ''
  const settings = store.current.getState().settings
  const headers = null
  const protocol = settings?.protocol?.split(',')[0]
  const host = settings?.host

  if (config.settings.apiPath) {
    apiPath = config.settings.apiPath
  } else {
    apiPath = protocol + '://' + host
  }

  apiPath = addTrailingSlash(apiPath)
  adjustedPath = removeFirstSlash(path)
  adjustedPath =
    adjustedPath !== '/' ? addTrailingSlash(adjustedPath) : adjustedPath

  let url = `${apiPath}${adjustedPath}`

  if (params) {
    const querystring = new URLSearchParams(
      removeEmptyValues(params),
    ).toString()

    if (querystring) {
      url += `?${querystring}`
    }
  }

  return url
}

import msalInstance, { scopes } from '@ors/config/msalConfig'
import { formatApiUrl } from './utils'

export async function msalAccessToken() {
  const account =
    msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0]
  if (!account) return null
  const token = await msalInstance.acquireTokenSilent({ account, scopes })
  return token.accessToken
}

/** Exchange a browser MSAL token for the Django cookies used by direct links. */
export async function loginWithMsal() {
  const token = await msalAccessToken()
  if (!token) return false
  const response = await fetch(formatApiUrl('/api/auth/adfs-login/'), {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw response
  return true
}

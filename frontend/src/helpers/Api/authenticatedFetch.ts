import { msalAccessToken } from './msalLogin'

/** Add MSAL authentication without consuming or parsing the response. */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await msalAccessToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  return fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  })
}

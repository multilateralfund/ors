import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import msalInstance, { scopes } from '@ors/config/msalConfig'
import { loginWithMsal, msalAccessToken } from './msalLogin'

vi.mock('./utils', () => ({ formatApiUrl: (path: string) => path }))
vi.mock('@ors/config/msalConfig', () => ({
  default: {
    getActiveAccount: vi.fn(),
    getAllAccounts: vi.fn(),
    acquireTokenSilent: vi.fn(),
  },
  scopes: ['api/.default'],
}))

const account = { homeAccountId: 'signed-in-user' }

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(msalInstance.getActiveAccount).mockReturnValue(account as any)
  vi.mocked(msalInstance.getAllAccounts).mockReturnValue([])
  vi.mocked(msalInstance.acquireTokenSilent).mockResolvedValue({
    accessToken: 'fresh-microsoft-token',
  } as any)
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
})

afterEach(() => vi.unstubAllGlobals())

describe('MSAL-to-Django login', () => {
  it('sets the Django cookies before a caller can return to a download', async () => {
    expect(await loginWithMsal()).toBe(true)
    expect(msalInstance.acquireTokenSilent).toHaveBeenCalledWith({
      account,
      scopes,
    })
    expect(fetch).toHaveBeenCalledWith('/api/auth/adfs-login/', {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: 'Bearer fresh-microsoft-token' },
    })
  })

  it('uses the cached account if none is active', async () => {
    vi.mocked(msalInstance.getActiveAccount).mockReturnValue(null)
    vi.mocked(msalInstance.getAllAccounts).mockReturnValue([account as any])
    expect(await msalAccessToken()).toBe('fresh-microsoft-token')
  })

  it('does not issue a request when there is no MSAL account', async () => {
    vi.mocked(msalInstance.getActiveAccount).mockReturnValue(null)
    expect(await loginWithMsal()).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not return to a download if Django refuses the exchange', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 401 }))
    await expect(loginWithMsal()).rejects.toMatchObject({ status: 401 })
  })
})

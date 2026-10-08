import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { msalAccessToken } from './msalLogin'
import { authenticatedFetch } from './authenticatedFetch'

vi.mock('./msalLogin', () => ({ msalAccessToken: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(msalAccessToken).mockResolvedValue('fresh-microsoft-token')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')))
})

afterEach(() => vi.unstubAllGlobals())

const url = '/api/projects/v2/export/?project_id=44063'

describe('authenticatedFetch', () => {
  it('adds an MSAL bearer token and sends Django cookies', async () => {
    await authenticatedFetch(url)
    const [requestedUrl, options] = vi.mocked(fetch).mock.calls[0]
    expect(requestedUrl).toBe(url)
    expect(options?.credentials).toBe('include')
    expect(new Headers(options?.headers).get('Authorization')).toBe(
      'Bearer fresh-microsoft-token',
    )
  })

  it('uses cookies without a bearer token for local users', async () => {
    vi.mocked(msalAccessToken).mockResolvedValue(null)
    await authenticatedFetch(url)
    const options = vi.mocked(fetch).mock.calls[0][1]
    expect(options?.credentials).toBe('include')
    expect(new Headers(options?.headers).has('Authorization')).toBe(false)
  })

  it('preserves request options and other headers', async () => {
    const controller = new AbortController()
    await authenticatedFetch(url, {
      method: 'POST',
      body: 'data',
      signal: controller.signal,
      headers: {
        'X-CSRFToken': 'csrf',
        Authorization: 'Bearer old-token',
      },
    })
    const options = vi.mocked(fetch).mock.calls[0][1]
    expect(options).toMatchObject({
      method: 'POST',
      body: 'data',
      signal: controller.signal,
    })
    expect(new Headers(options?.headers).get('X-CSRFToken')).toBe('csrf')
    expect(new Headers(options?.headers).get('Authorization')).toBe(
      'Bearer fresh-microsoft-token',
    )
  })

  it('returns the unconsumed file response', async () => {
    const response = new Response('xlsx', {
      headers: { 'Content-Disposition': 'attachment; filename="project.xlsx"' },
    })
    vi.mocked(fetch).mockResolvedValue(response)
    const result = await authenticatedFetch(url)
    expect(result).toBe(response)
    expect(result.bodyUsed).toBe(false)
    expect(await result.blob()).toHaveProperty('size', 4)
  })

  it('does not send a request when MSAL needs interaction', async () => {
    vi.mocked(msalAccessToken).mockRejectedValue(new Error('Sign-in required'))
    await expect(authenticatedFetch(url)).rejects.toThrow('Sign-in required')
    expect(fetch).not.toHaveBeenCalled()
  })
})
